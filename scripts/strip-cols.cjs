const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldCode = `      for (let i = 0; i < bList.length; i++) {
        const item = { ...bList[i], sort_order: i }; if (item.is_visible === undefined) item.is_visible = true; await supabase.from('brochures').upsert(item);
      }
      for (let i = 0; i < vList.length; i++) {
        const item = { ...vList[i], sort_order: i }; if (item.is_visible === undefined) item.is_visible = true; await supabase.from('videos').upsert(item);
      }`;

const newCode = `      for (let i = 0; i < bList.length; i++) {
        const item = { ...bList[i], sort_order: i }; 
        if (item.is_visible === undefined) item.is_visible = true; 
        delete item.urls; 
        await supabase.from('brochures').upsert(item);
      }
      for (let i = 0; i < vList.length; i++) {
        const item = { ...vList[i], sort_order: i }; 
        if (item.is_visible === undefined) item.is_visible = true; 
        delete item.uploadedAt; 
        await supabase.from('videos').upsert(item);
      }`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('src/App.tsx', content);
console.log('Stripped extra columns!');
