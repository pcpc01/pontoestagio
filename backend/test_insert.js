require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing Supabase Insert...');
  const id = crypto.randomUUID();
  try {
    const { data, error } = await supabase
      .from('WorkSchedule')
      .insert([{ id, name: 'Test Schedule', dailyHours: 8, weeklyHours: 40 }])
      .select();
    
    if (error) {
      console.error('Insert failed:', error);
      if (error.code === '42501') {
        console.error('HINT: This is a permission error (RLS). You might be using the ANON key instead of the SERVICE_ROLE key.');
      }
    } else {
      console.log('Insert successful!', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
