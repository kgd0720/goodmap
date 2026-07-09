const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('const saveToSupabase =')) {
  const insertPos = content.indexOf('const fetchBrandConfig =');
  const saveToSupabaseCode = `
  const saveToSupabase = async (bList: any[], vList: any[], delType?: string, delId?: string) => {
    try {
      if (delType === 'brochures' && delId) {
        await supabase.from('brochures').delete().eq('id', delId);
      }
      if (delType === 'videos' && delId) {
        await supabase.from('videos').delete().eq('id', delId);
      }
      
      for (let i = 0; i < bList.length; i++) {
        await supabase.from('brochures').upsert({ ...bList[i], sort_order: i });
      }
      for (let i = 0; i < vList.length; i++) {
        await supabase.from('videos').upsert({ ...vList[i], sort_order: i });
      }
      return { success: true };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message };
    }
  };
  `;
  content = content.slice(0, insertPos) + saveToSupabaseCode + content.slice(insertPos);
}

// Replace each known block
const fetchCodeB = `      const saveRes = await fetch("/api/brand-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brochures: updatedBrochures,
          videos: adminVideos
        })
      });
      const saveData: any = { success: true };`;

const fetchCodeV = `      const saveRes = await fetch("/api/brand-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brochures: adminBrochures,
          videos: updatedVideos
        })
      });
      const saveData: any = { success: true };`;

// Handle add/update brochure (doesn't have 'id' defined or it's different)
content = content.replace(fetchCodeB, `const saveData = await saveToSupabase(updatedBrochures, adminVideos);`); // 1 Add
content = content.replace(fetchCodeB, `const saveData = await saveToSupabase(updatedBrochures, adminVideos);`); // 2 Update
// handleDeleteBrochure
content = content.replace(fetchCodeB, `const saveData = await saveToSupabase(updatedBrochures, adminVideos, 'brochures', id);`); // 3 Delete

// Handle add/update video
content = content.replace(fetchCodeV, `const saveData = await saveToSupabase(adminBrochures, updatedVideos);`); // 4 Add
content = content.replace(fetchCodeV, `const saveData = await saveToSupabase(adminBrochures, updatedVideos);`); // 5 Update
// handleDeleteVideo
content = content.replace(fetchCodeV, `const saveData = await saveToSupabase(adminBrochures, updatedVideos, 'videos', id);`); // 6 Delete

// Handle bulk
content = content.replace(fetchCodeB, `const saveData = await saveToSupabase(updatedBrochures, adminVideos);`); // 7 Bulk B
content = content.replace(fetchCodeV, `const saveData = await saveToSupabase(adminBrochures, updatedVideos);`); // 8 Bulk V

fs.writeFileSync('src/App.tsx', content);
console.log('Done replacement');
