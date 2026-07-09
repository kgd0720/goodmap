const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex1 = /try\s*\{\s*const formData = new FormData\(\);\s*formData\.append\(\"file\", file\);\s*const uploadRes = await fetch\(\"\/api\/upload-brochure\"[\s\S]*?catch\s*\(fallbackErr:\s*any\)\s*\{\s*console\.error\(\"Base64 upload failed\",\s*fallbackErr\);\s*\}\s*\}/g;

const replacement1 = `try {
            const { data, error } = await supabase.storage
              .from('brand_assets')
              .upload(\`brochures/\${Date.now()}_\${file.name}\`, file, { upsert: true });
            
            if (!error && data) {
              const { data: publicUrlData } = supabase.storage.from('brand_assets').getPublicUrl(data.path);
              uploadData = { success: true, url: publicUrlData.publicUrl };
              uploadSuccess = true;
            } else {
              console.error('Supabase upload error:', error);
            }
          } catch (err) {
            console.error('Upload exception:', err);
          }`;

content = content.replace(regex1, replacement1);

const regex2 = /try\s*\{\s*const formData = new FormData\(\);\s*formData\.append\(\"file\", row\.file\);\s*const uploadRes = await fetch\(\"\/api\/upload-brochure\"[\s\S]*?catch\s*\(fallbackErr:\s*any\)\s*\{\s*throw new Error\(\`\[\$\{row\.title\}\] .*?:\s*\$\{fallbackErr\.message\}\`\);\s*\}\s*\}/g;

const replacement2 = `try {
            const { data, error } = await supabase.storage
              .from('brand_assets')
              .upload(\`brochures/\${Date.now()}_\${row.file.name}\`, row.file, { upsert: true });
            
            if (!error && data) {
              const { data: publicUrlData } = supabase.storage.from('brand_assets').getPublicUrl(data.path);
              uploadData = { success: true, url: publicUrlData.publicUrl };
              uploadSuccess = true;
            } else {
              console.error('Supabase upload error:', error);
            }
          } catch (err: any) {
            throw new Error(\`[\${row.title}] Upload error: \${err.message}\`);
          }`;

content = content.replace(regex2, replacement2);

fs.writeFileSync('src/App.tsx', content);
console.log('Upload logic replaced!');
