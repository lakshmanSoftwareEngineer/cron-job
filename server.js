const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;
const TARGET_URL = 'https://n8n-t6ib.onrender.com/';

// Middleware
app.use(express.json());

// Store monitoring logs in memory (in production, consider using a database)
let monitoringLogs = [];

// Function to format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Function to log messages with timestamp
const log = (message, type = 'INFO') => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    type,
    message
  };
  
  console.log(`[${timestamp}] ${type}: ${message}`);
  monitoringLogs.push(logEntry);
  
  // Keep only last 100 logs to prevent memory issues
  if (monitoringLogs.length > 100) {
    monitoringLogs = monitoringLogs.slice(-100);
  }
};

// Function to check the target website
const checkWebsite = async () => {
  try {
    const startTime = Date.now();
    const response = await axios.get(TARGET_URL, {
      timeout: 10000, // 10 second timeout
      validateStatus: function (status) {
        return status < 500; // Resolve only if the status code is less than 500
      }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.status >= 200 && response.status < 300) {
      log(`✅ SUCCESS: Website loaded successfully - Status: ${response.status}, Response time: ${responseTime}ms`, 'SUCCESS');
    } else {
      log(`⚠️ WARNING: Website responded but with status: ${response.status}, Response time: ${responseTime}ms`, 'WARNING');
    }
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
    
    log(`❌ FAILURE: Failed to load website - ${errorMessage}`, 'ERROR');
  }
};

// Schedule the cron job to run every minute
cron.schedule('* * * * *', () => {
  log('Running scheduled website check...', 'INFO');
  checkWebsite();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Website Monitor is running',
    targetUrl: TARGET_URL,
    status: 'active',
    nextCheck: 'Every minute',
    uptime: process.uptime()
  });
});

// Get monitoring logs
app.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const recentLogs = monitoringLogs.slice(-limit);
  
  res.json({
    total: monitoringLogs.length,
    showing: recentLogs.length,
    logs: recentLogs
  });
});

// Get latest status
app.get('/status', (req, res) => {
  const latestLogs = monitoringLogs.slice(-5);
  const successCount = monitoringLogs.filter(log => log.type === 'SUCCESS').length;
  const errorCount = monitoringLogs.filter(log => log.type === 'ERROR').length;
  
  res.json({
    targetUrl: TARGET_URL,
    totalChecks: successCount + errorCount,
    successCount,
    errorCount,
    successRate: successCount + errorCount > 0 ? ((successCount / (successCount + errorCount)) * 100).toFixed(2) + '%' : '0%',
    latestLogs,
    lastCheckTime: latestLogs.length > 0 ? latestLogs[latestLogs.length - 1].timestamp : null
  });
});

// Manual check endpoint
app.post('/check', async (req, res) => {
  log('Manual check triggered via API', 'INFO');
  await checkWebsite();
  
  const latestLog = monitoringLogs[monitoringLogs.length - 1];
  res.json({
    message: 'Manual check completed',
    result: latestLog
  });
});

// Health check endpoint for Vercel
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: getTimestamp(),
    uptime: process.uptime()
  });
});

// Start the server
app.listen(PORT, () => {
  log(`🚀 Server started on port ${PORT}`, 'INFO');
  log(`📊 Monitoring ${TARGET_URL} every minute`, 'INFO');
  log(`📝 View logs at: http://localhost:${PORT}/logs`, 'INFO');
  log(`📊 View status at: http://localhost:${PORT}/status`, 'INFO');
  
  // Perform initial check
  setTimeout(() => {
    log('Performing initial website check...', 'INFO');
    checkWebsite();
  }, 2000);
});

module.exports = app;

