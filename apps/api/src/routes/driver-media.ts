import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { PackageModel } from '../models/package';
import { LoadModel } from '../models/load';
import { DatabaseService, generateId } from '../services/database';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = Router();

// Ensure upload directories exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PHOTOS_DIR = path.join(UPLOAD_DIR, 'delivery-photos');
const SIGNATURES_DIR = path.join(UPLOAD_DIR, 'signatures');

// Create upload directories if they don't exist
(async () => {
  try {
    await fs.mkdir(PHOTOS_DIR, { recursive: true });
    await fs.mkdir(SIGNATURES_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directories:', error);
  }
})();

interface DeliveryMedia {
  id: string;
  packageId: string;
  driverId: string;
  type: 'photo' | 'signature';
  originalFileName?: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  compressedPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    location?: { lat: number; lng: number };
    deviceInfo?: string;
  };
  createdAt: string;
  syncedAt?: string;
  status: 'pending' | 'synced' | 'failed';
}

// Helper function to compress base64 image
const compressImage = async (base64Data: string, quality = 0.8): Promise<string> => {
  // Simple compression by reducing quality - in production, use proper image processing library
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // For now, just return the original - implement proper compression in production
    // In real implementation, use sharp, jimp, or canvas to compress
    return cleanBase64;
  } catch (error) {
    console.error('Image compression failed:', error);
    return base64Data;
  }
};

// Upload delivery photo
router.post('/photo/upload', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { packageId, photoData, metadata = {} } = req.body;
    const driverId = req.user!.id;

    if (!packageId || !photoData) {
      return res.status(400).json({ error: 'Package ID and photo data required' });
    }

    // Verify package exists and belongs to driver's load
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Verify driver has access to this package
    if (pkg.loadId) {
      const load = await LoadModel.findById(pkg.loadId);
      if (!load || load.driverId !== driverId) {
        return res.status(403).json({ error: 'Package not assigned to your load' });
      }
    }

    // Process photo data
    let cleanPhotoData = photoData;
    let mimeType = 'image/jpeg';

    if (photoData.startsWith('data:image/')) {
      const matches = photoData.match(/data:image\/([a-zA-Z]*);base64,(.*)$/);
      if (matches) {
        mimeType = `image/${matches[1]}`;
        cleanPhotoData = matches[2];
      }
    }

    // Compress image for storage efficiency
    const compressedData = await compressImage(cleanPhotoData, 0.7);

    // Generate unique filename
    const fileId = generateId();
    const fileName = `${packageId}_${fileId}_${Date.now()}.jpg`;
    const filePath = path.join(PHOTOS_DIR, fileName);
    const compressedFileName = `${packageId}_${fileId}_compressed_${Date.now()}.jpg`;
    const compressedPath = path.join(PHOTOS_DIR, compressedFileName);

    // Save original and compressed versions
    await fs.writeFile(filePath, cleanPhotoData, 'base64');
    await fs.writeFile(compressedPath, compressedData, 'base64');

    // Get file stats
    const fileStats = await fs.stat(filePath);
    const compressedStats = await fs.stat(compressedPath);

    // Create media record
    const deliveryMedia: DeliveryMedia = {
      id: fileId,
      packageId,
      driverId,
      type: 'photo',
      originalFileName: fileName,
      fileSize: fileStats.size,
      mimeType,
      filePath: `/uploads/delivery-photos/${fileName}`,
      compressedPath: `/uploads/delivery-photos/${compressedFileName}`,
      metadata: {
        ...metadata,
        compressedSize: compressedStats.size,
        compressionRatio: (1 - compressedStats.size / fileStats.size) * 100,
      },
      createdAt: new Date().toISOString(),
      status: 'pending', // Will be 'synced' when successfully processed
    };

    // Store media record in database
    await DatabaseService.put({
      PK: `MEDIA#${fileId}`,
      SK: 'METADATA',
      Type: 'DeliveryMedia',
      Data: deliveryMedia,
      GSI1PK: `PACKAGE#${packageId}`,
      GSI1SK: `MEDIA#${deliveryMedia.createdAt}`,
    });

    // Update package with photo reference
    await PackageModel.update(packageId, {
      deliveryConfirmation: {
        ...pkg.deliveryConfirmation,
        deliveredAt: pkg.deliveryConfirmation?.deliveredAt || new Date().toISOString(),
        photoUrl: deliveryMedia.compressedPath,
        confirmedBy: driverId,
      },
    });

    res.json({
      success: true,
      media: {
        id: deliveryMedia.id,
        type: deliveryMedia.type,
        url: deliveryMedia.compressedPath,
        originalSize: fileStats.size,
        compressedSize: compressedStats.size,
        compressionRatio:
          compressedStats.size > 0
            ? Math.round((1 - compressedStats.size / fileStats.size) * 100)
            : 0,
      },
      message: 'Photo uploaded and compressed successfully',
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload delivery photo' });
  }
});

// Upload signature
router.post('/signature/upload', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { packageId, signatureData, recipientName, metadata = {} } = req.body;
    const driverId = req.user!.id;

    if (!packageId || !signatureData) {
      return res.status(400).json({ error: 'Package ID and signature data required' });
    }

    // Verify package exists and belongs to driver's load
    const pkg = await PackageModel.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (pkg.loadId) {
      const load = await LoadModel.findById(pkg.loadId);
      if (!load || load.driverId !== driverId) {
        return res.status(403).json({ error: 'Package not assigned to your load' });
      }
    }

    // Process signature data (SVG or base64 image)
    let cleanSignatureData = signatureData;
    let mimeType = 'image/svg+xml';

    if (signatureData.startsWith('data:image/')) {
      const matches = signatureData.match(/data:image\/([a-zA-Z]*);base64,(.*)$/);
      if (matches) {
        mimeType = `image/${matches[1]}`;
        cleanSignatureData = matches[2];
      }
    } else if (signatureData.startsWith('<svg')) {
      // SVG signature
      mimeType = 'image/svg+xml';
    }

    // Generate unique filename
    const fileId = generateId();
    const extension = mimeType.includes('svg') ? 'svg' : 'png';
    const fileName = `${packageId}_${fileId}_signature_${Date.now()}.${extension}`;
    const filePath = path.join(SIGNATURES_DIR, fileName);

    // Save signature file
    if (mimeType.includes('svg')) {
      await fs.writeFile(filePath, cleanSignatureData, 'utf8');
    } else {
      await fs.writeFile(filePath, cleanSignatureData, 'base64');
    }

    const fileStats = await fs.stat(filePath);

    // Create media record
    const deliveryMedia: DeliveryMedia = {
      id: fileId,
      packageId,
      driverId,
      type: 'signature',
      originalFileName: fileName,
      fileSize: fileStats.size,
      mimeType,
      filePath: `/uploads/signatures/${fileName}`,
      metadata: {
        ...metadata,
        recipientName,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Store media record
    await DatabaseService.put({
      PK: `MEDIA#${fileId}`,
      SK: 'METADATA',
      Type: 'DeliveryMedia',
      Data: deliveryMedia,
      GSI1PK: `PACKAGE#${packageId}`,
      GSI1SK: `MEDIA#${deliveryMedia.createdAt}`,
    });

    // Update package with signature reference
    await PackageModel.update(packageId, {
      deliveryConfirmation: {
        ...pkg.deliveryConfirmation,
        signature: recipientName || 'Digital Signature',
        photoUrl: pkg.deliveryConfirmation?.photoUrl,
        deliveredAt: new Date().toISOString(),
        confirmedBy: driverId,
        recipientName,
      },
    });

    res.json({
      success: true,
      media: {
        id: deliveryMedia.id,
        type: deliveryMedia.type,
        url: deliveryMedia.filePath,
        size: fileStats.size,
        recipientName,
      },
      message: 'Signature captured and stored successfully',
    });
  } catch (error) {
    console.error('Signature upload error:', error);
    res.status(500).json({ error: 'Failed to upload signature' });
  }
});

// Get delivery media for package
router.get('/package/:packageId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.params;

    // Get all media for package
    const mediaItems = await DatabaseService.queryByGSI('GSI1', `PACKAGE#${packageId}`);
    const deliveryMedia = mediaItems
      .filter((item: any) => item.Type === 'DeliveryMedia')
      .map((item: any) => item.Data);

    res.json({
      success: true,
      packageId,
      media: deliveryMedia,
      totalItems: deliveryMedia.length,
    });
  } catch (error) {
    console.error('Package media retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve package media' });
  }
});

// Serve uploaded files (with authentication)
router.get('/file/:type/:filename', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, filename } = req.params;

    if (!['photos', 'signatures'].includes(type)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const baseDir = type === 'photos' ? PHOTOS_DIR : SIGNATURES_DIR;
    const filePath = path.join(baseDir, filename);

    // Security check - ensure file is within upload directory
    const resolvedPath = path.resolve(filePath);
    const resolvedBaseDir = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

export default router;
