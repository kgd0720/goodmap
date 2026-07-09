const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  const configPath = path.join(__dirname, '../brand_config.json');
  if (!fs.existsSync(configPath)) {
    console.error("brand_config.json not found!");
    return;
  }

  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const brochures = data.brochures || [];
  const videos = data.videos || [];

  console.log(`Found ${brochures.length} brochures and ${videos.length} videos to migrate.`);

  // Migrate brochures
  for (let i = 0; i < brochures.length; i++) {
    const b = brochures[i];
    const insertData = {
      id: b.id || `b-${Date.now()}-${i}`,
      title: b.title || '',
      description: b.description || '',
      filename: b.filename || '',
      url: b.url || '',
      type: b.type || 'pdf',
      allowDownload: !!b.allowDownload,
      thumbnailUrl: b.thumbnailUrl || null,
      uploadedAt: b.uploadedAt || new Date().toISOString(),
      is_visible: true,
      sort_order: i
    };

    const { error } = await supabase.from('brochures').upsert(insertData);
    if (error) {
      console.error(`Error migrating brochure ${b.title}:`, error);
    } else {
      console.log(`Migrated brochure: ${b.title}`);
    }
  }

  // Migrate videos
  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    const insertData = {
      id: v.id || `v-${Date.now()}-${i}`,
      title: v.title || '',
      desc: v.desc || '',
      youtubeUrl: v.youtubeUrl || '',
      duration: v.duration || '',
      is_visible: true,
      sort_order: i
    };

    const { error } = await supabase.from('videos').upsert(insertData);
    if (error) {
      console.error(`Error migrating video ${v.title}:`, error);
    } else {
      console.log(`Migrated video: ${v.title}`);
    }
  }

  console.log("Migration complete!");
}

migrate();
