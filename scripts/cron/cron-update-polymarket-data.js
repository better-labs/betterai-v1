#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config();

const https = require('https');

const CRON_SECRET = process.env.CRON_SECRET;
const DOMAIN = process.env.DOMAIN || 'localhost:3000';
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';

const options = {
  hostname: DOMAIN.includes(':') ? DOMAIN.split(':')[0] : DOMAIN,
  port: DOMAIN.includes(':') ? parseInt(DOMAIN.split(':')[1]) : (PROTOCOL === 'https' ? 443 : 3000),
  path: '/api/cron/update-polymarket-data',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

// Friendly startup logs mirroring other cron scripts
const url = `${PROTOCOL}://${options.hostname}:${options.port}${options.path}`;
console.log('🔄 Triggering Polymarket data update...');
console.log(`📍 Endpoint: ${url}`);

console.log(`Triggering update-polymarket-data at ${new Date().toISOString()}`);

const req = (PROTOCOL === 'https' ? https : require('http')).request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', data);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Update Polymarket events and market data job completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Update Polymarket events and market data job failed');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error triggering update-polymarket-data:', error.message);
  process.exit(1);
});

req.end(); 