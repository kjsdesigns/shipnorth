'use client';

import { useState } from 'react';
import { CheckCircle, Camera, PenTool, X, Upload, Calendar } from 'lucide-react';

interface DeliveryConfirmationModalProps {
  packageId: string;
  trackingNumber: string;
  recipientName: string;
  onConfirm: (deliveryData: any) => void;
  onClose: () => void;
}

export default function DeliveryConfirmationModal({
  packageId,
  trackingNumber,
  recipientName,
  onConfirm,
  onClose,
}: DeliveryConfirmationModalProps) {
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [actualRecipientName, setActualRecipientName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let photoUrl = '';
      
      // Upload photo if provided
      if (photoFile) {
        // Mock photo upload - in production, upload to S3
        photoUrl = `https://mock-s3.amazonaws.com/delivery-photos/${packageId}-${Date.now()}.jpg`;
      }

      const deliveryData = {
        deliveredAt: `${deliveryDate}T${deliveryTime}:00Z`,
        photoUrl: photoUrl || undefined,
        signature: signature || undefined,
        recipientName: actualRecipientName || undefined,
        relationship: relationship || undefined,
        notes: notes || undefined,
      };

      await onConfirm(deliveryData);
    } catch (error) {
      console.error('Delivery confirmation error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Delivery
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {trackingNumber} • {recipientName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Delivery Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Delivery Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white pl-10"
                  required
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Delivery Time *
              </label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Recipient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Received By (if different)
              </label>
              <input
                type="text"
                value={actualRecipientName}
                onChange={(e) => setActualRecipientName(e.target.value)}
                placeholder="Leave blank if same as addressee"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select relationship</option>
                <option value="Resident">Resident</option>
                <option value="Family Member">Family Member</option>
                <option value="Neighbor">Neighbor</option>
                <option value="Building Manager">Building Manager</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              {photoPreview ? (
                <div className="text-center">
                  <img 
                    src={photoPreview} 
                    alt="Delivery proof" 
                    className="mx-auto max-h-32 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview('');
                    }}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                      Upload a photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Signature Capture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Digital Signature (Optional)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <PenTool className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">Signature capture would be implemented here</p>
                  <button
                    type="button"
                    className="mt-2 text-blue-600 hover:text-blue-500 text-sm"
                  >
                    Capture Signature
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about the delivery..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}