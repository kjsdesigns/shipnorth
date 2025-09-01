#!/usr/bin/env tsx

import { AddressModel } from '../models/address';

async function geocodeAllAddresses() {
  try {
    console.log('🌍 Starting comprehensive address geocoding...');
    
    // Geocode all existing addresses
    await AddressModel.geocodeAllAddresses();
    
    // Verify geocoding results
    const result = await AddressModel.query(`
      SELECT 
        geocoding_status,
        COUNT(*) as count
      FROM addresses 
      GROUP BY geocoding_status
      ORDER BY geocoding_status
    `);
    
    console.log('📊 Geocoding Results:');
    result.rows.forEach(row => {
      console.log(`   ${row.geocoding_status}: ${row.count} addresses`);
    });
    
    // Check specifically for addresses with coordinates
    const coordsResult = await AddressModel.query(`
      SELECT COUNT(*) as count FROM addresses WHERE coordinates IS NOT NULL
    `);
    
    console.log(`   📍 Addresses with coordinates: ${coordsResult.rows[0].count}`);
    
    // Test a sample address
    const sampleResult = await AddressModel.query(`
      SELECT id, city, province_state, coordinates, geocoding_status 
      FROM addresses 
      WHERE coordinates IS NOT NULL 
      LIMIT 1
    `);
    
    if (sampleResult.rows.length > 0) {
      const sample = sampleResult.rows[0];
      console.log('🎯 Sample geocoded address:');
      console.log(`   City: ${sample.city}, ${sample.province_state}`);
      console.log(`   Status: ${sample.geocoding_status}`);
      console.log(`   Coordinates: ${sample.coordinates ? JSON.parse(sample.coordinates).lat + ', ' + JSON.parse(sample.coordinates).lng : 'None'}`);
    }
    
    console.log('✅ Address geocoding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during address geocoding:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  geocodeAllAddresses()
    .then(() => {
      console.log('🎉 Geocoding script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Geocoding script failed:', error);
      process.exit(1);
    });
}

export { geocodeAllAddresses };