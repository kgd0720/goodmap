const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
const oldCode = `      const saveRes = await fetch("/api/brand-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brochures: updatedBrochures,
          videos: adminVideos
        })
      });`;
const newCode = `      for (let i = 0; i < updatedBrochures.length; i++) {
        await supabase.from('brochures').upsert({ ...updatedBrochures[i], sort_order: i });
      }
      await supabase.from('brochures').delete().eq('id', id);`;
content = content.replace(oldCode, newCode);
fs.writeFileSync('src/App.tsx', content);
console.log('Patched');
