import { Router } from 'express';
import { authorize, AuthRequest } from '../middleware/auth';
import { User, UserModel } from '../models/user';
import { CityModel, City } from '../models/city';
import { DatabaseService } from '../services/database';
import bcrypt from 'bcryptjs';

const router = Router();

// All admin routes require admin role
router.use(authorize('admin'));

// User Management Routes

// Get all users with optional filtering
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;

    let users = await UserModel.list(role as string, parseInt(limit as string));

    // Apply additional filters
    if (status) {
      users = users.filter((user) => user.status === status);
    }

    if (search) {
      const searchTerm = (search as string).toLowerCase();
      users = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm) ||
          user.firstName?.toLowerCase().includes(searchTerm) ||
          user.lastName?.toLowerCase().includes(searchTerm) ||
          `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm)
      );
    }

    // Simple pagination
    const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Log admin action
    console.log(`Admin ${req.user?.email} accessed user list - ${users.length} users found`);

    res.json({
      users: paginatedUsers,
      totalUsers: users.length,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(users.length / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role
    const validRoles = ['customer', 'staff', 'admin', 'driver'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      status: 'active' as const,
    };

    const newUser = await UserModel.create(userData);

    // Log admin action
    console.log(`Admin ${req.user?.email} created new user: ${email} with role: ${role}`);

    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get specific user details
router.get('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate role if provided
    if (updates.role) {
      const validRoles = ['customer', 'staff', 'admin', 'driver'];
      if (!validRoles.includes(updates.role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }
    }

    // Check if email is being changed and if it's already taken
    if (updates.email) {
      const existingUser = await UserModel.findByEmail(updates.email);
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ error: 'Email already in use by another user' });
      }
    }

    const updatedUser = await UserModel.update(id, updates);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    console.log(`Admin ${req.user?.email} updated user: ${id}`, updates);

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate/reactivate user
router.patch('/users/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const updatedUser = await UserModel.update(id, { status });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    console.log(`Admin ${req.user?.email} changed user ${id} status to: ${status}`);

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset user password
router.post('/users/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await UserModel.update(id, { password: hashedPassword });

    // Log admin action (without logging the actual password)
    console.log(`Admin ${req.user?.email} reset password for user: ${user.email}`);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user (soft delete - set status to inactive)
router.delete('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For now, we'll just deactivate instead of hard delete
    const updatedUser = await UserModel.update(id, { status: 'inactive' });

    // Log admin action
    console.log(`Admin ${req.user?.email} deactivated user: ${user.email}`);

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Enhanced bulk operations with role management
router.post('/users/bulk-update', async (req: AuthRequest, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const results = [];
    for (const userId of userIds) {
      try {
        let processedUpdates = { ...updates };
        
        // Handle special role operations
        if (updates.addRole) {
          const user = await UserModel.findById(userId);
          if (user) {
            const currentRoles = user.roles || [user.role];
            if (!currentRoles.includes(updates.addRole)) {
              processedUpdates.roles = [...currentRoles, updates.addRole];
            }
            delete processedUpdates.addRole;
          }
        }
        
        if (updates.removeRole) {
          const user = await UserModel.findById(userId);
          if (user) {
            const currentRoles = user.roles || [user.role];
            processedUpdates.roles = currentRoles.filter(role => role !== updates.removeRole);
            // Ensure primary role is maintained
            if (!processedUpdates.roles.includes(user.role)) {
              processedUpdates.roles.push(user.role);
            }
          }
          delete processedUpdates.removeRole;
        }

        const updatedUser = await UserModel.update(userId, processedUpdates);
        if (updatedUser) {
          results.push({ userId, success: true, user: updatedUser });
        } else {
          results.push({ userId, success: false, error: 'User not found' });
        }
      } catch (error) {
        results.push({ userId, success: false, error: 'Update failed' });
      }
    }

    // Log admin action
    console.log(
      `Admin ${req.user?.email} performed bulk update on ${userIds.length} users`,
      updates
    );

    res.json({ results });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

// Get user activity logs with enhanced mock data
router.get('/users/:id/activity', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate realistic mock activity data based on user role
    const now = new Date();
    const activities = [];
    
    // Recent login activity
    if (user.role !== 'customer') { // Staff, drivers, admins login more frequently
      for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
        const loginTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        activities.push({
          id: `activity-${Date.now()}-${i}`,
          action: 'Login',
          timestamp: loginTime.toISOString(),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          details: {
            portal: user.role === 'admin' ? 'staff' : user.role,
            sessionDuration: `${Math.floor(Math.random() * 240) + 30} minutes`,
            device: 'Desktop'
          }
        });
      }
    }

    // Role-specific activities
    if (user.roles?.includes('admin') || user.role === 'admin') {
      activities.push({
        id: `activity-admin-${Date.now()}`,
        action: 'User Management Access',
        timestamp: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        details: {
          module: 'User Management',
          action: 'Viewed user list',
          affectedUsers: Math.floor(Math.random() * 10) + 1
        }
      });
    }

    if (user.roles?.includes('staff') || user.role === 'staff') {
      activities.push({
        id: `activity-staff-${Date.now()}`,
        action: 'Package Management',
        timestamp: new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        details: {
          module: 'Packages',
          action: 'Updated package status',
          packageCount: Math.floor(Math.random() * 5) + 1
        }
      });
    }

    if (user.roles?.includes('driver') || user.role === 'driver') {
      activities.push({
        id: `activity-driver-${Date.now()}`,
        action: 'GPS Location Update',
        timestamp: new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.25',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        details: {
          module: 'GPS Tracking',
          location: 'Toronto, ON',
          accuracy: '±5m',
          loadId: 'LOAD-001'
        }
      });
    }

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Log admin action
    console.log(`Admin ${req.user?.email} accessed activity logs for user: ${user.email}`);

    res.json({ activities: activities.slice(0, 20) }); // Return last 20 activities
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Export user data
router.get('/users/export', async (req: AuthRequest, res) => {
  try {
    const users = await UserModel.list();

    // Log admin action
    console.log(`Admin ${req.user?.email} exported user data - ${users.length} users`);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.json');
    res.json(users);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// Existing routes

// Get settings
router.get('/settings', async (req, res) => {
  res.json({ settings: {} });
});

// Update settings
router.put('/settings', async (req, res) => {
  res.json({ success: true });
});

// Generate reports
router.get('/reports', async (req, res) => {
  res.json({ reports: [] });
});

// Configure carriers
router.post('/carriers', async (req, res) => {
  res.json({ success: true });
});

// Cities Management Routes

// Get all cities with package counts
router.get('/cities', async (req: AuthRequest, res) => {
  try {
    const cities = await CityModel.getCitiesWithPackageCounts();

    // Log admin action
    console.log(`Admin ${req.user?.email} accessed cities list - ${cities.length} cities found`);

    res.json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Create new city
router.post('/cities', async (req: AuthRequest, res) => {
  try {
    const { name, province, alternativeNames } = req.body;

    // Validate required fields
    if (!name || !province) {
      return res.status(400).json({ error: 'City name and province are required' });
    }

    // Check if city already exists in this province
    const existingCities = await CityModel.findByName(name, province);
    if (existingCities.length > 0) {
      return res.status(409).json({ error: 'City already exists in this province' });
    }

    // Create new city
    const cityData = {
      name: name.trim(),
      province: province.trim(),
      alternativeNames: alternativeNames || [],
    };

    const newCity = await CityModel.create(cityData);

    // Log admin action
    console.log(`Admin ${req.user?.email} created new city: ${name}, ${province}`);

    res.status(201).json({ city: newCity });
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ error: 'Failed to create city' });
  }
});

// Get specific city details
router.get('/cities/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const city = await CityModel.findById(id);

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json({ city });
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ error: 'Failed to fetch city' });
  }
});

// Update city
router.put('/cities/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if city exists
    const existingCity = await CityModel.findById(id);
    if (!existingCity) {
      return res.status(404).json({ error: 'City not found' });
    }

    // If name or province is being changed, check for duplicates
    if (
      (updates.name && updates.name !== existingCity.name) ||
      (updates.province && updates.province !== existingCity.province)
    ) {
      const duplicates = await CityModel.findByName(
        updates.name || existingCity.name,
        updates.province || existingCity.province
      );
      const hasDuplicate = duplicates.some((city) => city.id !== id);
      if (hasDuplicate) {
        return res
          .status(409)
          .json({ error: 'City with this name already exists in the province' });
      }
    }

    const updatedCity = await CityModel.update(id, updates);

    // Log admin action
    console.log(`Admin ${req.user?.email} updated city: ${id}`, updates);

    res.json({ city: updatedCity });
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({ error: 'Failed to update city' });
  }
});

// Delete city
router.delete('/cities/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const city = await CityModel.findById(id);
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    await CityModel.delete(id);

    // Log admin action
    console.log(`Admin ${req.user?.email} deleted city: ${city.name}, ${city.province}`);

    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ error: 'Failed to delete city' });
  }
});

// Add alternative name to city
router.post('/cities/:id/alternative-names', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Alternative name is required' });
    }

    const updatedCity = await CityModel.addAlternativeName(id, name);

    if (!updatedCity) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Log admin action
    console.log(`Admin ${req.user?.email} added alternative name "${name}" to city: ${id}`);

    res.json({ city: updatedCity });
  } catch (error) {
    console.error('Error adding alternative name:', error);
    res.status(500).json({ error: 'Failed to add alternative name' });
  }
});

// Remove alternative name from city
router.delete('/cities/:id/alternative-names', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Alternative name is required' });
    }

    const updatedCity = await CityModel.removeAlternativeName(id, name);

    if (!updatedCity) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Log admin action
    console.log(`Admin ${req.user?.email} removed alternative name "${name}" from city: ${id}`);

    res.json({ city: updatedCity });
  } catch (error) {
    console.error('Error removing alternative name:', error);
    res.status(500).json({ error: 'Failed to remove alternative name' });
  }
});

export default router;
