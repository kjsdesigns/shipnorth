-- Communication and Audit System Tables
-- Migration 002: Customer Communication Hub and Audit Logging

-- Communication Preferences Table
CREATE TABLE IF NOT EXISTS communication_preferences (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    
    -- Email preferences
    email_enabled BOOLEAN DEFAULT true,
    email_address VARCHAR(255) NOT NULL,
    email_events JSONB DEFAULT '[]',
    
    -- SMS preferences  
    sms_enabled BOOLEAN DEFAULT false,
    sms_phone_number VARCHAR(20),
    sms_events JSONB DEFAULT '[]',
    
    -- General preferences
    quiet_hours_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'America/Toronto',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(customer_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Message Log Table
CREATE TABLE IF NOT EXISTS message_log (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    
    -- Message details
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
    event VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    
    -- Related object tracking
    related_object_type VARCHAR(50) NOT NULL,
    related_object_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Comprehensive Audit Log Table (ISO 27001 / SOX Compliant)
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(255) PRIMARY KEY,
    
    -- WHO: Actor information
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'system', 'api')),
    actor_id VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    
    -- WHAT: Action information
    action VARCHAR(100) NOT NULL,
    action_category VARCHAR(20) NOT NULL CHECK (action_category IN ('AUTH', 'CRUD', 'BUSINESS', 'SYSTEM', 'SECURITY')),
    
    -- WHERE: Resource information  
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    resource_name VARCHAR(500),
    
    -- WHEN: Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- CONTEXT: Request context
    client_ip INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- CHANGES: What changed (for UPDATE actions)
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB,
    
    -- RELATIONSHIPS: Related objects
    related_objects JSONB DEFAULT '[]',
    
    -- METADATA: Additional context
    metadata JSONB DEFAULT '{}',
    
    -- RESULT: Success/failure
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    
    -- COMPLIANCE: Risk and sensitivity
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    sensitive_data BOOLEAN DEFAULT false,
    compliance_flags JSONB DEFAULT '[]'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_log_customer_id ON message_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_message_log_sent_at ON message_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_log_type ON message_log(type);
CREATE INDEX IF NOT EXISTS idx_message_log_status ON message_log(status);
CREATE INDEX IF NOT EXISTS idx_message_log_event ON message_log(event);
CREATE INDEX IF NOT EXISTS idx_message_log_related_object ON message_log(related_object_type, related_object_id);

-- Comprehensive audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_risk_level ON audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_log_sensitive_data ON audit_log(sensitive_data);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_message_log_content_search ON message_log USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_audit_log_search ON audit_log USING gin(to_tsvector('english', 
    coalesce(actor_email, '') || ' ' || 
    coalesce(action, '') || ' ' || 
    coalesce(resource_name, '') || ' ' ||
    coalesce(error_message, '')
));

-- Default communication preferences for existing customers
INSERT INTO communication_preferences (id, customer_id, email_enabled, email_address, email_events, sms_enabled, sms_events)
SELECT 
    'comm_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 9),
    id,
    true,
    email,
    '["package_delivered", "package_shipped", "delivery_exception"]'::jsonb,
    false,
    '["package_delivered", "delivery_exception"]'::jsonb
FROM customers 
WHERE NOT EXISTS (
    SELECT 1 FROM communication_preferences WHERE customer_id = customers.id
);

-- Insert audit log for migration
INSERT INTO audit_log (
    id, actor_type, actor_id, actor_email, action, action_category,
    resource_type, resource_id, resource_name, success, metadata
) VALUES (
    'audit_migration_002_' || extract(epoch from now()),
    'system',
    'migration',
    'system@shipnorth.com',
    'CREATE_COMMUNICATION_SYSTEM',
    'SYSTEM',
    'system',
    'communication_hub',
    'Communication Hub and Audit System',
    true,
    '{"migration": "002-communication-and-audit", "tables": ["communication_preferences", "message_log", "audit_log"]}'::jsonb
);

COMMENT ON TABLE communication_preferences IS 'Customer communication preferences for email and SMS notifications';
COMMENT ON TABLE message_log IS 'Complete log of all sent messages (email and SMS) with delivery status';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail following ISO 27001 standards for all system activities';