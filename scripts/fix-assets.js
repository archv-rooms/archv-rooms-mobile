const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (fs.existsSync(from)) fs.renameSync(from, to);

function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('assets/node_modules')) {
        fs.writeFileSync(p, c.split('assets/node_modules').join('assets/vendor'));
      }
    }
  }
}
walk(dist);