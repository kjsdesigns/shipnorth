-- Multi-role support migration for Shipnorth ACL system
-- This migration adds support for multiple roles per user and portal preferences

-- Add multi-role support to users table
ALTER TABLE users 
ADD COLUMN roles TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN last_used_portal VARCHAR(20),
ADD COLUMN default_portal VARCHAR(20);

-- Migrate existing single role to roles array
UPDATE users 
SET roles = ARRAY[role]::TEXT[] 
WHERE role IS NOT NULL;

-- Set default portal based on existing role
UPDATE users 
SET default_portal = CASE 
    WHEN role = 'customer' THEN 'customer'
    WHEN role = 'driver' THEN 'driver'
    WHEN role = 'staff' THEN 'staff'
    WHEN role = 'admin' THEN 'staff'
    ELSE 'customer'
END
WHERE role IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_users_last_used_portal ON users (last_used_portal);
CREATE INDEX IF NOT EXISTS idx_users_default_portal ON users (default_portal);

-- Add comments for documentation
COMMENT ON COLUMN users.roles IS 'Array of roles for multi-role support (customer, driver, staff, admin)';
COMMENT ON COLUMN users.last_used_portal IS 'Last portal the user accessed (customer, driver, staff)';
COMMENT ON COLUMN users.default_portal IS 'Default portal for the user when logging in';

-- Create audit log table for permission tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs (success);

-- Add comments for audit logs
COMMENT ON TABLE audit_logs IS 'Audit trail for all permission-based actions in the system';
COMMENT ON COLUMN audit_logs.action IS 'CASL action performed (create, read, update, delete, manage)';
COMMENT ON COLUMN audit_logs.resource IS 'CASL resource accessed (Package, Customer, Load, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context about the action (JSON)';

-- Insert some test users with multi-role support
INSERT INTO users (id, email, password, role, roles, default_portal, status, created_at) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@shipnorth.com', '$2b$10$demohashedpassword', 'admin', ARRAY['admin', 'staff'], 'staff', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'staff@shipnorth.com', '$2b$10$demohashedpassword', 'staff', ARRAY['staff'], 'staff', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'driver@shipnorth.com', '$2b$10$demohashedpassword', 'driver', ARRAY['driver'], 'driver', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'staff-driver@shipnorth.com', '$2b$10$demohashedpassword', 'staff', ARRAY['staff', 'driver'], 'staff', 'active', NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'customer@shipnorth.com', '$2b$10$demohashedpassword', 'customer', ARRAY['customer'], 'customer', 'active', NOW())
ON CONFLICT (id) DO UPDATE SET
  roles = EXCLUDED.roles,
  default_portal = EXCLUDED.default_portal;

-- Add audit log for this migration
INSERT INTO audit_logs (user_id, action, resource, details) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'create',
  'Settings',
  '{"migration": "001-multi-role-support", "description": "Added multi-role support and audit logging"}'
);

-- Verify migration success
DO $$
BEGIN
    -- Check if columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'roles') THEN
        RAISE EXCEPTION 'Migration failed: roles column not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE EXCEPTION 'Migration failed: audit_logs table not created';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully: Multi-role support and audit logging enabled';
END $$;