import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwzedwzcccxjxmmwemmg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3emVkd3pjY2N4anhtbXdlbW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDI2NzcsImV4cCI6MjA1NTgxODY3N30.JIPRUGDVyiNyQE6iShAQpBP5IMJkgWzuGAa2dA5Cu_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('Checking database tables...');
    
    // Get all tables from the system catalog
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error getting tables:', tablesError);
      
      // Try a simple query to 'files' table to see if it exists
      console.log('Trying direct query to files table...');
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .limit(1);
      
      if (filesError) {
        console.error('Error querying files table:', filesError);
      } else {
        console.log('Files table exists and returned:', filesData);
      }
    } else {
      console.log('Tables in the database:', tables);
      
      // Check if files table exists in the results
      const filesTable = tables.find(t => t.table_name === 'files');
      
      if (filesTable) {
        console.log('Files table found in the database');
        
        // Try to get column information for the files table
        console.log('Getting column information for files table...');
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type')
          .eq('table_name', 'files')
          .eq('table_schema', 'public');
        
        if (columnsError) {
          console.error('Error getting column information:', columnsError);
        } else {
          console.log('Files table columns:', columns);
        }
      } else {
        console.error('Files table not found in the database!');
      }
    }
    
    // Check storage buckets
    console.log('\nChecking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets);
      
      // Try to list files in each bucket
      for (const bucket of buckets) {
        console.log(`\nTrying to list files in bucket '${bucket.name}'...`);
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list();
        
        if (filesError) {
          console.error(`Error listing files in bucket '${bucket.name}':`, filesError);
        } else {
          console.log(`Files in bucket '${bucket.name}':`, files);
        }
      }
    }
    
    // Try to create a simple file in storage (without authentication)
    console.log('\nTrying to upload a test file to storage...');
    const testFile = new Blob(['Test file content'], { type: 'text/plain' });
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload('test.txt', testFile);
    
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
      console.log('This is likely because authentication is required for uploads.');
    } else {
      console.log('Test file uploaded successfully:', uploadData);
      
      // Clean up the test file
      console.log('Removing test file...');
      const { data: removeData, error: removeError } = await supabase.storage
        .from('files')
        .remove(['test.txt']);
      
      if (removeError) {
        console.error('Error removing test file:', removeError);
      } else {
        console.log('Test file removed successfully:', removeData);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDatabase();
