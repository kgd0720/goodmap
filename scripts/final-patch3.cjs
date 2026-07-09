const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regexB = /const saveRes = await fetch\("\/api\/brand-config", \{\s*method: "POST",\s*headers: \{ "Content-Type": "application\/json" \},\s*body: JSON\.stringify\(\{\s*brochures: updatedBrochures,\s*videos: adminVideos\s*\}\)\s*\}\);\s*const saveData:\s*any\s*=\s*\{\s*success:\s*true\s*\};/g;

const regexV = /const saveRes = await fetch\("\/api\/brand-config", \{\s*method: "POST",\s*headers: \{ "Content-Type": "application\/json" \},\s*body: JSON\.stringify\(\{\s*brochures: adminBrochures,\s*videos: updatedVideos\s*\}\)\s*\}\);\s*const saveData:\s*any\s*=\s*\{\s*success:\s*true\s*\};/g;

content = content.replace(regexB, "const saveData = await saveToSupabase(updatedBrochures, adminVideos, typeof id !== 'undefined' ? 'brochures' : undefined, typeof id !== 'undefined' ? id : undefined);");
content = content.replace(regexV, "const saveData = await saveToSupabase(adminBrochures, updatedVideos, typeof id !== 'undefined' ? 'videos' : undefined, typeof id !== 'undefined' ? id : undefined);");

fs.writeFileSync('src/App.tsx', content);
console.log('Regex patch applied!');
