const axios = require('axios');

// Function to format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Function to check the target website
const checkWebsite = async (targetUrl = 'https://n8n-t6ib.onrender.com/') => {
  const timestamp = getTimestamp();
  
  try {
    const startTime = Date.now();
    const response = await axios.get(targetUrl, {
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const logEntry = {
      timestamp,
      type: response.status >= 200 && response.status < 300 ? 'SUCCESS' : 'WARNING',
      message: response.status >= 200 && response.status < 300 
        ? `✅ SUCCESS: Website loaded successfully - Status: ${response.status}, Response time: ${responseTime}ms`
        : `⚠️ WARNING: Website responded but with status: ${response.status}, Response time: ${responseTime}ms`,
      status: response.status,
      responseTime
    };
    
    console.log(`[${timestamp}] ${logEntry.type}: ${logEntry.message}`);
    return logEntry;
    
  } catch (error) {
    let errorMessage = 'Unknown error';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - Server might be down';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timed out';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found';
    } else if (error.response) {
      errorMessage = `HTTP ${error.response.status} - ${error.response.statusText}`;
    } else {
      errorMessage = error.message;
    }
    
    const logEntry = {
      timestamp,
      type: 'ERROR',
      message: `❌ FAILURE: Failed to load website - ${errorMessage}`,
      error: error.message
    };
    
    console.log(`[${timestamp}] ERROR: ${logEntry.message}`);
    return logEntry;
  }
};

// Vercel Cron Function Handler
export default async function handler(req, res) {
  // Verify this is a cron job request (optional security check)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Cron job triggered: Running scheduled website check...');
    
    const targetUrl = process.env.TARGET_URL || 'https://n8n-t6ib.onrender.com/';
    const result = await checkWebsite(targetUrl);
    
    return res.status(200).json({
      success: true,
      message: 'Website check completed',
      result,
      timestamp: getTimestamp()
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cron job failed',
      message: error.message,
      timestamp: getTimestamp()
    });
  }
}