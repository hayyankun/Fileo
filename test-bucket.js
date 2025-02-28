import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwzedwzcccxjxmmwemmg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3emVkd3pjY2N4anhtbXdlbW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDI2NzcsImV4cCI6MjA1NTgxODY3N30.JIPRUGDVyiNyQE6iShAQpBP5IMJkgWzuGAa2dA5Cu_c';

// Change this to match a bucket that exists in your Supabase project
const STORAGE_BUCKET = 'files';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
  try {
    console.log('Checking bucket existence and permissions...');
    
    // List buckets to check if our bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    const ourBucket = buckets.find(b => b.name === STORAGE_BUCKET);
    
    if (!ourBucket) {
      console.error(`Bucket '${STORAGE_BUCKET}' does not exist!`);
      
      // Try to list files in a pre-existing bucket
      const bucketNamesToTry = ['files', 'avatars', 'public', 'private'];
      
      for (const bucketName of bucketNamesToTry) {
        console.log(`Trying to list files in bucket '${bucketName}'...`);
        const { data: filesInBucket, error: filesError } = await supabase.storage.from(bucketName).list();
        
        if (!filesError) {
          console.log(`Success! Bucket '${bucketName}' exists and can be listed:`, filesInBucket);
        } else {
          console.log(`Could not list bucket '${bucketName}':`, filesError);
        }
      }
      
      return;
    }
    
    console.log(`Bucket '${STORAGE_BUCKET}' exists with settings:`, ourBucket);
    
    // Test bucket permissions by listing files
    const { data: files, error: filesError } = await supabase.storage.from(STORAGE_BUCKET).list();
    
    if (filesError) {
      console.error('Error listing files in bucket:', filesError);
    } else {
      console.log('Files in bucket:', files);
    }
    
    // Test table existence
    const { data: tableInfo, error: tableError } = await supabase
      .from('files')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking files table:', tableError);
      
      // Try to check what tables exist
      console.log('Trying to query other tables to find one that works');
      const tablesToTry = ['files', 'users', 'profiles', 'storage'];
      
      for (const tableName of tablesToTry) {
        console.log(`Trying to query table '${tableName}'...`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`Success! Table '${tableName}' exists and can be queried:`, data);
        } else {
          console.log(`Could not query table '${tableName}':`, error);
        }
      }
    } else {
      console.log('Files table exists and can be queried.');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testBucket();
