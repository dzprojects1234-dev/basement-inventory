// Helper function to validate requests
const crypto = require('crypto');

// Simple API key authentication
const API_KEYS = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

function authenticateRequest(event) {
  // Check API key in header
  const apiKey = event.headers['x-api-key'];
  
  // For development, allow without key
  if (process.env.NODE_ENV === 'development') {
    return { authenticated: true };
  }
  
  if (API_KEYS.length > 0 && apiKey && API_KEYS.includes(apiKey)) {
    return { authenticated: true };
  }
  
  return { 
    authenticated: false, 
    error: 'Invalid API key' 
  };
}


module.exports = { authenticateRequest };
