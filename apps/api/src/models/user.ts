import { DatabaseService, generateId } from '../services/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'customer' | 'staff' | 'admin' | 'driver'; // Keep for backward compatibility
  roles?: ('staff' | 'admin' | 'driver' | 'customer')[]; // Optional multi-role support
  customerId?: string; // Link to customer record if role includes customer
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  lastUsedPortal?: 'staff' | 'driver' | 'customer'; // Track last portal used
  createdAt?: string;
  updatedAt?: string;
}

export class UserModel {
  static async create(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Omit<User, 'password'>> {
    const id = generateId();

    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Destructure to avoid overwriting the hashed password
    const { password, ...userDataWithoutPassword } = user;

    const newUser: User = {
      id,
      ...userDataWithoutPassword,
      password: hashedPassword,
      status: user.status || 'active',
    };

    await DatabaseService.put({
      PK: `USER#${id}`,
      SK: 'METADATA',
      GSI1PK: `EMAIL#${user.email.toLowerCase()}`,
      GSI1SK: `USER#${id}`,
      Type: 'User',
      Data: newUser,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async findById(id: string): Promise<User | null> {
    const item = await DatabaseService.get(`USER#${id}`, 'METADATA');
    return item ? item.Data : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const items = await DatabaseService.queryByGSI('GSI1', `EMAIL#${email.toLowerCase()}`);
    const userItems = items.filter((item: any) => item.Type === 'User');
    return userItems.length > 0 ? userItems[0].Data : null;
  }

  static async validatePassword(
    email: string,
    password: string
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.findByEmail(email);
    if (!user || user.status !== 'active') return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // Update last login
    await this.updateLastLogin(user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await DatabaseService.update(`USER#${id}`, 'METADATA', {
      'Data.lastLogin': new Date().toISOString(),
    });
  }

  static async update(id: string, updates: Partial<User>): Promise<Omit<User, 'password'> | null> {
    const current = await this.findById(id);
    if (!current) return null;

    // Hash new password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = { ...current, ...updates };

    const updateData: any = {
      Data: updatedUser,
    };

    // Update email index if email changed
    if (updates.email && updates.email !== current.email) {
      // Delete old email index
      await DatabaseService.delete(`EMAIL#${current.email.toLowerCase()}`, `USER#${id}`);

      // Create new email index
      updateData.GSI1PK = `EMAIL#${updates.email.toLowerCase()}`;
    }

    const result = await DatabaseService.update(`USER#${id}`, 'METADATA', updateData);

    if (result && result.Data) {
      const { password, ...userWithoutPassword } = result.Data;
      return userWithoutPassword;
    }

    return null;
  }

  static async list(role?: string, limit = 100): Promise<Omit<User, 'password'>[]> {
    let items;

    if (role) {
      items = await DatabaseService.scan({
        FilterExpression: '#type = :type AND #data.#role = :role',
        ExpressionAttributeNames: {
          '#type': 'Type',
          '#data': 'Data',
          '#role': 'role',
        },
        ExpressionAttributeValues: {
          ':type': 'User',
          ':role': role,
        },
        Limit: limit,
      });
    } else {
      items = await DatabaseService.scan({
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'Type',
        },
        ExpressionAttributeValues: {
          ':type': 'User',
        },
        Limit: limit,
      });
    }

    return items
      .map((item: any) => {
        const { password, ...userWithoutPassword } = item.Data;
        return userWithoutPassword;
      })
      .filter(Boolean);
  }

  static async delete(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    await DatabaseService.delete(`USER#${id}`, 'METADATA');
    await DatabaseService.delete(`EMAIL#${user.email.toLowerCase()}`, `USER#${id}`);

    return true;
  }

  static async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) return false;

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await DatabaseService.update(`USER#${id}`, 'METADATA', {
      'Data.password': hashedPassword,
    });

    return true;
  }

  // Helper methods for new multi-role system
  static async updateLastUsedPortal(
    id: string,
    portal: 'staff' | 'driver' | 'customer'
  ): Promise<boolean> {
    try {
      await this.update(id, {
        lastUsedPortal: portal,
        lastLogin: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Failed to update last used portal:', error);
      return false;
    }
  }

  static getAvailablePortals(
    user: User | Omit<User, 'password'>
  ): ('staff' | 'driver' | 'customer')[] {
    const portals: ('staff' | 'driver' | 'customer')[] = [];
    const userRoles = user.roles || [user.role];

    if (userRoles.includes('customer')) {
      portals.push('customer');
    }
    if (userRoles.includes('staff') || userRoles.includes('admin')) {
      portals.push('staff');
    }
    if (userRoles.includes('driver')) {
      portals.push('driver');
    }

    return portals;
  }

  static getDefaultPortal(user: User | Omit<User, 'password'>): 'staff' | 'driver' | 'customer' {
    // Return last used portal if available and user still has access
    if (user.lastUsedPortal && this.getAvailablePortals(user).includes(user.lastUsedPortal)) {
      return user.lastUsedPortal;
    }

    const userRoles = user.roles || [user.role];

    // Default priority: customer > staff > driver
    if (userRoles.includes('customer')) return 'customer';
    if (
      userRoles.includes('staff') ||
      userRoles.includes('admin') ||
      user.role === 'staff' ||
      user.role === 'admin'
    )
      return 'staff';
    if (userRoles.includes('driver') || user.role === 'driver') return 'driver';

    throw new Error('User has no valid portal access');
  }

  static hasAdminAccess(user: User | Omit<User, 'password'>): boolean {
    const userRoles = user.roles || [user.role];
    return userRoles.includes('admin') || user.role === 'admin';
  }

  static canAccessPortal(user: User, portal: 'staff' | 'driver' | 'customer'): boolean {
    return this.getAvailablePortals(user).includes(portal);
  }
}
