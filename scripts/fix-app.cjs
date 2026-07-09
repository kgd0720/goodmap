const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Restore handleDeleteBrochure
content = content.replace(/const handleDeleteBrochure = async \(id: string\) => \{\s+if \(!\(await safeConfirm[\s\S]*?const saveData = await saveToSupabase\(updatedBrochures, adminVideos, undefined, undefined\);/g, (match) => {
  return match.replace('undefined, undefined', "'brochures', id");
});

// Restore handleDeleteVideo
content = content.replace(/const handleDeleteVideo = async \(id: string\) => \{\s+if \(!\(await safeConfirm[\s\S]*?const saveData = await saveToSupabase\(adminBrochures, updatedVideos, undefined, undefined\);/g, (match) => {
  return match.replace('undefined, undefined', "'videos', id");
});

fs.writeFileSync('src/App.tsx', content);
