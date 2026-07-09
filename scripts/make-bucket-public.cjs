require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function makeBucketPublic() {
  // Update the bucket to be public
  const { data, error } = await supabase.storage.updateBucket('brand_assets', {
    public: true,
    allowedMimeTypes: null,
    fileSizeLimit: null
  });
  
  if (error) {
    console.error('Error updating bucket:', error);
  } else {
    console.log('Successfully made brand_assets bucket PUBLIC!');
  }
}
makeBucketPublic();
