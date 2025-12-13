const { createClient } = require('@supabase/supabase-js');
const { authenticateRequest } = require('./auth');

// Initialize Supabase with service role (server-side only)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  // Authenticate request
  const auth = authenticateRequest(event);
  if (!auth.authenticated) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: auth.error || 'Unauthorized' }),
    };
  }

  try {
    // GET - Fetch all items
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          inventory: data,
          count: data.length 
        }),
      };
    }

    // POST - Create new item
    if (event.httpMethod === 'POST') {
      const item = JSON.parse(event.body);
      
      // Validate required fields
      if (!item.name || !item.category || !item.code) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          name: item.name,
          icon: item.icon || 'fa-box',
          category: item.category,
          code: item.code,
          quantity: item.quantity || 0,
          notes: item.notes || '',
          photo: item.photo || null,
          last_updated: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          item: data[0],
          message: 'Item created successfully' 
        }),
      };
    }

    // PUT - Update item
    if (event.httpMethod === 'PUT') {
      const item = JSON.parse(event.body);
      
      if (!item.id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Item ID required' }),
        };
      }

      const { data, error } = await supabase
        .from('inventory')
        .update({
          name: item.name,
          icon: item.icon,
          category: item.category,
          code: item.code,
          quantity: item.quantity,
          notes: item.notes,
          photo: item.photo,
          last_updated: new Date().toISOString()
        })
        .eq('id', item.id)
        .select();

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          item: data[0],
          message: 'Item updated successfully' 
        }),
      };
    }

    // DELETE - Remove item
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Item ID required' }),
        };
      }

      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Item deleted successfully' 
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
    };
  }
};
