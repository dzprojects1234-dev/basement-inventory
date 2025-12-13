// Netlify Function for inventory storage
const fs = require('fs');
const path = require('path');

// Path to JSON file storage
const DATA_FILE = path.join(process.cwd(), 'data', 'inventory.json');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ inventory: [] }));
}

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Read data from file
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, inventory: data.inventory }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Parse incoming data
      const incomingData = JSON.parse(event.body);
      
      // Validate data
      if (!incomingData.inventory || !Array.isArray(incomingData.inventory)) {
        throw new Error('Invalid data format');
      }

      // Save to file
      fs.writeFileSync(DATA_FILE, JSON.stringify({
        inventory: incomingData.inventory,
        lastUpdated: new Date().toISOString(),
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: `Saved ${incomingData.inventory.length} items`,
          count: incomingData.inventory.length 
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      }),
    };
  }
};
