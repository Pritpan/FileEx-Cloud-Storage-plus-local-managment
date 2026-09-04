const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.jsx')) {
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/\[var\(--([^)]+)\)\]/g, '$1');
      // replace text-text-muted with text-muted
      c = c.replace(/text-text/g, 'text');
      fs.writeFileSync(p, c);
    }
  });
}
walk('./src');
