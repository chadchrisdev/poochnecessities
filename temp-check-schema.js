// Script to check the weights table schema
import { supabase } from './src/lib/supabase';

async function checkWeightsSchema() {
  try {
    console.log('Checking weights table schema...');
    
    // Get table information
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { tablename: 'weights' });
    
    if (tableError) {
      console.error('Error getting table info:', tableError);
      
      // Try with public schema
      console.log('Trying with public schema...');
      const { data: publicTableInfo, error: publicTableError } = await supabase
        .rpc('get_table_info', { tablename: 'public.weights' });
        
      if (publicTableError) {
        console.error('Error getting public.weights table info:', publicTableError);
      } else {
        console.log('public.weights table info:', publicTableInfo);
      }
    } else {
      console.log('weights table info:', tableInfo);
    }
    
    // Try to insert a record without the 'note' field
    console.log('Trying to insert a record without note field...');
    const { data: insertData, error: insertError } = await supabase
      .from('weights')
      .insert([
        { 
          dog_id: 'dummy-id', // Use a valid dog_id from your database
          weight_kg: 5.5,
          recorded_at: new Date().toISOString()
        }
      ]);
      
    if (insertError) {
      console.log('Insert error details:', insertError);
    } else {
      console.log('Insert succeeded:', insertData);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

// Run the function
checkWeightsSchema(); 