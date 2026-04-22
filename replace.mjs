import fs from 'fs';
['src/App.tsx', 'metadata.json'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/WPNBBF/g, 'WPNBF');
  fs.writeFileSync(file, content);
});
console.log('Replaced successfully');
