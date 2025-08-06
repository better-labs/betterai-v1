#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const https = require('https');

const CRON_SECRET = process.env.CRON_SECRET;
const DOMAIN = process.env.DOMAIN || 'localhost:3000';
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';

const options = {
  hostname: DOMAIN.includes(':') ? DOMAIN.split(':')[0] : DOMAIN,
  port: DOMAIN.includes(':') ? parseInt(DOMAIN.split(':')[1]) : (PROTOCOL === 'https' ? 443 : 3000),
  path: '/api/cron/update-polymarket-all',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

console.log(`Triggering update-polymarket-all at ${new Date().toISOString()}`);

const req = (PROTOCOL === 'https' ? https : require('http')).request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', data);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Update all Polymarket events job completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Update all Polymarket events job failed');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error triggering update-polymarket-all:', error.message);
  process.exit(1);
});

req.end(); 