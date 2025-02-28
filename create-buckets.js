// This script creates necessary storage buckets in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwzedwzcccxjxmmwemmg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3emVkd3pjY2N4anhtbXdlbW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDI2NzcsImV4cCI6MjA1NTgxODY3N30.JIPRUGDVyiNyQE6iShAQpBP5IMJkgWzuGAa2dA5Cu_c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBuckets() {
  console.log('Creating storage buckets in Supabase...');
  
  // List of buckets to create
  const bucketsToCreate = ['public', 'files', 'avatars'];
  
  // First check existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    // If we can't list buckets, try to create them anyway
  } else {
    console.log('Existing buckets:', existingBuckets);
  }
  
  // Try to create each bucket if it doesn't exist
  for (const bucketName of bucketsToCreate) {
    // Check if bucket already exists
    if (existingBuckets && existingBuckets.find(b => b.name === bucketName)) {
      console.log(`Bucket '${bucketName}' already exists.`);
      
      // Try to update bucket to public
      try {
        const { data, error } = await supabase.storage.updateBucket(bucketName, {
          public: true
        });
        
        if (error) {
          console.error(`Error updating bucket '${bucketName}' to public:`, error);
        } else {
          console.log(`Successfully updated bucket '${bucketName}' to public`);
        }
      } catch (err) {
        console.error(`Error during bucket update:`, err);
      }
      
      continue;
    }
    
    // Try to create the bucket
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make the bucket public
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error(`Error creating bucket '${bucketName}':`, error);
      } else {
        console.log(`Successfully created bucket '${bucketName}'`);
      }
    } catch (error) {
      console.error(`Error during bucket creation:`, error);
    }
  }
  
  // List buckets again to see the results
  const { data: updatedBuckets, error: updatedListError } = await supabase.storage.listBuckets();
  
  if (updatedListError) {
    console.error('Error listing updated buckets:', updatedListError);
  } else {
    console.log('Updated bucket list:', updatedBuckets);
  }
}

createBuckets().catch(err => console.error('Uncaught error:', err));
