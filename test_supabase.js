require('dotenv').config({ path: './backend/.env' });
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
    } else {
      console.log('Connection successful! Found', data, 'employees.');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
