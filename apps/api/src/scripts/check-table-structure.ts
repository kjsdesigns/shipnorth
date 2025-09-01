#!/usr/bin/env node

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'shipnorth',
  user: process.env.POSTGRES_USER || 'shipnorth',
  password: process.env.POSTGRES_PASSWORD || 'shipnorth_dev',
});

async function checkTableStructures() {
  console.log('📋 Checking database table structures...');
  
  try {
    // Check customers table
    const customersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n👥 CUSTOMERS table columns:');
    customersColumns.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check packages table
    const packagesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'packages' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📦 PACKAGES table columns:');
    packagesColumns.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check sample data from both tables
    const sampleCustomers = await pool.query('SELECT * FROM customers LIMIT 3');
    console.log('\n👤 Sample customer data:');
    sampleCustomers.rows.forEach((customer, i) => {
      console.log(`  ${i+1}. ${customer.name} (${customer.id.slice(0,8)}...) - ${customer.city || 'No city'}, ${customer.province || 'No province'}`);
    });
    
    const samplePackages = await pool.query('SELECT * FROM packages LIMIT 3');
    console.log('\n📮 Sample package data:');
    samplePackages.rows.forEach((pkg, i) => {
      console.log(`  ${i+1}. ${pkg.tracking_number || pkg.id.slice(0,8)} - Customer: ${pkg.customer_id?.slice(0,8) || 'NONE'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structures:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructures();