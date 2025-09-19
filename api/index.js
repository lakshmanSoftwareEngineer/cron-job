const express = require('express');
const axios = require('axios');

const app = express();

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
  
  return logEntry;
};

// Function to check the target website
const checkWebsite = async (targetUrl = 'https://n8n-t6ib.onrender.com/') => {
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
    
    if (response.status >= 200 && response.status < 300) {
      return log(`✅ SUCCESS: Website loaded successfully - Status: ${response.status}, Response time: ${responseTime}ms`, 'SUCCESS');
    } else {
      return log(`⚠️ WARNING: Website responded but with status: ${response.status}, Response time: ${responseTime}ms`, 'WARNING');
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
    
    return log(`❌ FAILURE: Failed to load website - ${errorMessage}`, 'ERROR');
  }
};

// Main API handler
export default async function handler(req, res) {
  const { method, url } = req;
  const urlPath = new URL(url, `http://${req.headers.host}`).pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (urlPath) {
      case '/':
      case '/api':
        return res.json({
          message: 'Website Monitor API is running',
          endpoints: {
            '/': 'API info',
            '/api/check': 'Manual website check (POST)',
            '/api/logs': 'Get monitoring logs',
            '/api/status': 'Get monitoring status',
            '/api/health': 'Health check'
          },
          timestamp: getTimestamp()
        });

      case '/api/check':
        if (method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const targetUrl = req.body?.url || 'https://n8n-t6ib.onrender.com/';
        log('Manual check triggered via API', 'INFO');
        const result = await checkWebsite(targetUrl);
        
        return res.json({
          message: 'Manual check completed',
          result,
          targetUrl
        });

      case '/api/logs':
        const limit = parseInt(req.query.limit) || 50;
        const recentLogs = monitoringLogs.slice(-limit);
        
        return res.json({
          total: monitoringLogs.length,
          showing: recentLogs.length,
          logs: recentLogs
        });

      case '/api/status':
        const latestLogs = monitoringLogs.slice(-5);
        const successCount = monitoringLogs.filter(log => log.type === 'SUCCESS').length;
        const errorCount = monitoringLogs.filter(log => log.type === 'ERROR').length;
        
        return res.json({
          totalChecks: successCount + errorCount,
          successCount,
          errorCount,
          successRate: successCount + errorCount > 0 ? ((successCount / (successCount + errorCount)) * 100).toFixed(2) + '%' : '0%',
          latestLogs,
          lastCheckTime: latestLogs.length > 0 ? latestLogs[latestLogs.length - 1].timestamp : null
        });

      case '/api/health':
        return res.json({
          status: 'healthy',
          timestamp: getTimestamp(),
          uptime: process.uptime()
        });

      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }

}
