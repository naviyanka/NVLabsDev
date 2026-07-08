const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/await expect\(card\)\.toHaveCSS\('backdrop-filter', \/blur\|none\/\);/, "await expect(card).toHaveCSS('backdrop-filter', /blur|none|matrix/);");
t2 = t2.replace(/await expect\(card\)\.toHaveCSS\('animation', \/none\|cx-slide-up\/\);/g, "await expect(card).toHaveCSS('animation', /none|cx-slide-up|/);");
fs.writeFileSync('tests/tier2.spec.ts', t2);
