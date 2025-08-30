-- Shipnorth Database Schema
-- PostgreSQL initialization script

-- Users table (replaces DynamoDB User model)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    roles TEXT[], -- Multi-role support
    last_used_portal VARCHAR(50),
    customer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table 
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table (normalized approach)
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    type VARCHAR(50) NOT NULL, -- 'billing', 'shipping'
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    province_state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(3) DEFAULT 'CA',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packages table
CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(255) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    weight DECIMAL(10,2),
    length DECIMAL(10,2),
    width DECIMAL(10,2), 
    height DECIMAL(10,2),
    declared_value DECIMAL(10,2),
    description TEXT,
    ship_from_address_id UUID REFERENCES addresses(id),
    ship_to_address_id UUID REFERENCES addresses(id),
    status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(255),
    carrier VARCHAR(100),
    service_type VARCHAR(100),
    label_url TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loads table (delivery routes)
CREATE TABLE loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES users(id),
    vehicle VARCHAR(100),
    status VARCHAR(50) DEFAULT 'planned',
    departure_date DATE,
    estimated_duration INTEGER, -- minutes
    actual_duration INTEGER, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Load packages junction table
CREATE TABLE load_packages (
    load_id UUID REFERENCES loads(id),
    package_id UUID REFERENCES packages(id),
    sequence_order INTEGER,
    PRIMARY KEY (load_id, package_id)
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    package_id UUID REFERENCES packages(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id VARCHAR(255), -- PayPal transaction ID
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, key)
);

-- Indexes for performance
CREATE INDEX idx_packages_customer_id ON packages(customer_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX idx_load_packages_load_id ON load_packages(load_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_settings_category_key ON settings(category, key);

-- Insert demo users (for development, use plain text passwords)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@shipnorth.com', 'admin123', 'Admin', 'User', 'admin'),
('staff@shipnorth.com', 'staff123', 'Staff', 'User', 'staff'), 
('driver@shipnorth.com', 'driver123', 'Driver', 'User', 'driver'),
('test@test.com', 'test123', 'Test', 'Customer', 'customer');

-- Insert demo customer
INSERT INTO customers (id, name, email, phone, business_name) VALUES
(gen_random_uuid(), 'Test Customer', 'test@test.com', '555-0123', 'Test Business');