require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  try {
    const { data, error } = await supabase.from('Employee').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Connection failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Connection successful!');
      console.log('Result:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
