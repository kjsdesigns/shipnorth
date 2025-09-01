#!/usr/bin/env node

import axios from 'axios';

async function testAPIData() {
  console.log('🧪 Testing API data display...');
  
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:8850/auth/login', {
      email: 'admin@shipnorth.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    
    // Test customers API
    console.log('\n👥 Testing customers API...');
    const customersResponse = await axios.get('http://localhost:8850/customers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const customers = customersResponse.data.customers || [];
    console.log(`📊 Found ${customers.length} customers`);
    
    customers.slice(0, 3).forEach((customer: any, i: number) => {
      console.log(`  ${i + 1}. ${customer.name || customer.firstName + ' ' + customer.lastName}`);
      console.log(`     Address: ${customer.addressLine1 || 'MISSING'}, ${customer.city || 'MISSING'}, ${customer.province || 'MISSING'}`);
      console.log(`     Email: ${customer.email || 'MISSING'}`);
    });
    
    // Test packages API
    console.log('\n📦 Testing packages API...');
    const packagesResponse = await axios.get('http://localhost:8850/packages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const packages = packagesResponse.data.packages || [];
    console.log(`📊 Found ${packages.length} packages`);
    
    packages.slice(0, 3).forEach((pkg: any, i: number) => {
      console.log(`  ${i + 1}. ${pkg.trackingNumber || pkg.id?.slice(0,8)}`);
      console.log(`     Customer: ${pkg.customerName || 'MISSING'}`);
      console.log(`     Address: ${pkg.shipTo?.city || 'MISSING'}, ${pkg.shipTo?.province || 'MISSING'}`);
      console.log(`     Weight: ${pkg.weight || 'MISSING'} kg`);
    });
    
    console.log('\n🎯 API Test completed');
    
  } catch (error: any) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testAPIData();