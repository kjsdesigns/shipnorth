#!/usr/bin/env node

/**
 * Database Migration: Convert single role to multi-role system
 *
 * This script migrates existing users from the single `role` field
 * to the new `roles` array format while maintaining backward compatibility.
 */

import { DatabaseService } from '../services/database';
import { UserModel, User } from '../models/user';

interface LegacyUser {
  id: string;
  email: string;
  password: string;
  role: 'customer' | 'staff' | 'admin' | 'driver';
  firstName: string;
  lastName: string;
  phone?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

async function migrateUsersToMultiRole() {
  console.log('🔄 Starting user migration to multi-role system...');

  try {
    // Get all users from database
    console.log('📥 Fetching all users...');
    const items = await DatabaseService.scan({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'User',
      },
    });

    const users = items.map((item: any) => item.Data as LegacyUser);
    console.log(`📊 Found ${users.length} users to migrate`);

    if (users.length === 0) {
      console.log('✅ No users found - creating sample multi-role users');
      await createSampleMultiRoleUsers();
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Migrate each user
    for (const user of users) {
      try {
        // Check if user already has roles array
        if ((user as any).roles && Array.isArray((user as any).roles)) {
          console.log(`⏭️  Skipping ${user.email} - already has roles array`);
          skippedCount++;
          continue;
        }

        // Convert single role to roles array
        const roles = convertRoleToRoles(user.role);

        // Determine default portal
        const defaultPortal = getDefaultPortalForRole(user.role);

        // Update user with new structure
        const migratedUser = {
          ...user,
          roles,
          lastUsedPortal: defaultPortal,
          updatedAt: new Date().toISOString(),
        };

        // Save migrated user
        await DatabaseService.put({
          PK: `USER#${user.id}`,
          SK: 'METADATA',
          Type: 'User',
          Data: migratedUser,
          GSI1PK: `EMAIL#${user.email.toLowerCase()}`,
          GSI1SK: `USER#${user.id}`,
        });

        console.log(`✅ Migrated ${user.email}: ${user.role} → [${roles.join(', ')}]`);
        migratedCount++;
      } catch (error) {
        const errorMsg = `Failed to migrate ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Migration summary
    console.log('\n📋 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n🚨 Migration Errors:');
      errors.forEach((error) => console.log(`   • ${error}`));
    }

    // Verify migration
    await verifyMigration();
  } catch (error) {
    console.error('🚨 Migration failed:', error);
    process.exit(1);
  }
}

function convertRoleToRoles(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['staff', 'admin']; // Admin users get staff access too
    case 'staff':
      return ['staff'];
    case 'driver':
      return ['driver'];
    case 'customer':
      return ['customer'];
    default:
      console.warn(`⚠️  Unknown role: ${role}, defaulting to staff`);
      return ['staff'];
  }
}

function getDefaultPortalForRole(role: string): 'staff' | 'driver' | 'customer' {
  switch (role) {
    case 'admin':
    case 'staff':
      return 'staff';
    case 'driver':
      return 'driver';
    case 'customer':
      return 'customer';
    default:
      return 'staff';
  }
}

async function createSampleMultiRoleUsers() {
  console.log('👥 Creating sample multi-role users...');

  const sampleUsers = [
    {
      email: 'admin@shipnorth.com',
      password: 'admin123',
      role: 'admin' as const,
      roles: ['staff', 'admin'] as const,
      firstName: 'Admin',
      lastName: 'User',
      status: 'active' as const,
      lastUsedPortal: 'staff' as const,
    },
    {
      email: 'staff@shipnorth.com',
      password: 'staff123',
      role: 'staff' as const,
      roles: ['staff'] as const,
      firstName: 'Sarah',
      lastName: 'Staff',
      status: 'active' as const,
      lastUsedPortal: 'staff' as const,
    },
    {
      email: 'driver@shipnorth.com',
      password: 'driver123',
      role: 'driver' as const,
      roles: ['driver'] as const,
      firstName: 'Bob',
      lastName: 'Driver',
      status: 'active' as const,
      lastUsedPortal: 'driver' as const,
    },
    {
      email: 'driver-staff@shipnorth.com',
      password: 'driverstaff123',
      role: 'driver' as const,
      roles: ['driver', 'staff'] as const,
      firstName: 'Multi',
      lastName: 'Role',
      status: 'active' as const,
      lastUsedPortal: 'driver' as const,
    },
    {
      email: 'test@test.com',
      password: 'test123',
      role: 'customer' as const,
      roles: ['customer'] as const,
      firstName: 'Test',
      lastName: 'User',
      status: 'active' as const,
      lastUsedPortal: 'customer' as const,
    },
  ];

  for (const userData of sampleUsers) {
    try {
      await UserModel.create({
        ...userData,
        roles: [...userData.roles] as ('staff' | 'admin' | 'driver' | 'customer')[],
      });
      console.log(`✅ Created multi-role user: ${userData.email} [${userData.roles.join(', ')}]`);
    } catch (error) {
      console.log(`⚠️  User ${userData.email} may already exist`);
    }
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  try {
    const allUsers = await UserModel.list(undefined, 100);
    const multiRoleUsers = allUsers.filter((user: any) => user.roles && Array.isArray(user.roles));
    const legacyUsers = allUsers.filter((user: any) => !user.roles || !Array.isArray(user.roles));

    console.log(`📊 Migration Verification:`);
    console.log(`   Multi-role users: ${multiRoleUsers.length}`);
    console.log(`   Legacy users: ${legacyUsers.length}`);
    console.log(`   Total users: ${allUsers.length}`);

    if (legacyUsers.length > 0) {
      console.log('\n⚠️  Users still needing migration:');
      legacyUsers.forEach((user: any) => {
        console.log(`   • ${user.email} (${user.role})`);
      });
    } else {
      console.log('✅ All users successfully migrated to multi-role system!');
    }

    // Test portal access for migrated users
    console.log('\n🧪 Testing portal access...');
    for (const user of multiRoleUsers.slice(0, 3)) {
      const availablePortals = UserModel.getAvailablePortals(user);
      const defaultPortal = UserModel.getDefaultPortal(user);
      console.log(
        `   ${user.email}: portals=[${availablePortals.join(', ')}], default=${defaultPortal}`
      );
    }
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateUsersToMultiRole()
    .then(() => {
      console.log('\n🎉 User migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n🚨 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateUsersToMultiRole };
