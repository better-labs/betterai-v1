#!/usr/bin/env node

require('dotenv').config();

const https = require('https');
const http = require('http');

async function updateAIModels(dryRun = false) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET environment variable is not set');
    console.log('💡 Add CRON_SECRET to your .env.local file');
    process.exit(1);
  }

  const url = `${baseUrl}/api/cron/update-ai-models`;
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
      'User-Agent': 'BetterAI-Cron/1.0'
    }
  };

  if (dryRun) {
    console.log(`🔍 DRY RUN - Would update AI models from OpenRouter...`);
    console.log(`📍 Endpoint: ${url}`);
    console.log(`🔑 Using CRON_SECRET: ${cronSecret.substring(0, 8)}...`);
    return;
  }

  console.log(`🔄 Updating AI models from OpenRouter...`);
  console.log(`📍 Endpoint: ${url}`);
  
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            console.log(`✅ AI models updated successfully!`);
            console.log(`⏱️  Duration: ${duration}ms`);
            console.log(`📊 ${response.message}`);
            
            if (response.data) {
              console.log(`📈 Data:`, JSON.stringify(response.data, null, 2));
            }
          } else {
            console.error(`❌ Failed to update AI models`);
            console.error(`📊 Status: ${res.statusCode}`);
            console.error(`📝 Response:`, response);
            
            if (res.statusCode === 401) {
              console.log(`💡 Check that your CRON_SECRET matches the server's expected value`);
            } else if (res.statusCode === 500) {
              console.log(`💡 The server might not be running or there's an internal error`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to parse response:`, error);
          console.error(`📝 Raw response:`, data);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Request failed:`, error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`💡 The server at ${baseUrl} is not running`);
        console.log(`💡 Start the server with: npm run dev`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`💡 Could not resolve hostname: ${new URL(url).hostname}`);
      }
      
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      console.error(`❌ Request timed out after 30 seconds`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the script
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  
  updateAIModels(dryRun)
    .then(() => {
      console.log(`🎉 AI models update completed`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`💥 AI models update failed:`, error.message);
      process.exit(1);
    });
}

module.exports = { updateAIModels }; 