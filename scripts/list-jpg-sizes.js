const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../public/images/products/6');
if (!fs.existsSync(p)) { console.error('dir missing', p); process.exit(1); }
const files = fs.readdirSync(p).filter(f => f.toLowerCase().endsWith('.jpg')).sort();
files.forEach(f => {
  const s = fs.statSync(path.join(p, f));
  console.log(f, s.size);
});
console.log('total', files.length);
