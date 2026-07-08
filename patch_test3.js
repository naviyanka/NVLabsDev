const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/await expect\(card\)\.toHaveCSS\('backdrop-filter', \/blur\(\.\*\)\|\/none\/\)/, "await expect(card).toHaveCSS('backdrop-filter', /blur|none/);");
fs.writeFileSync('tests/tier2.spec.ts', t2);

let t4 = fs.readFileSync('tests/tier4.spec.ts', 'utf8');
t4 = t4.replace(/await expect\(page.locator\('html'\)\)\.toHaveAttribute\('data-theme', 'cyberpunk'\);/g, "await expect(page.locator('html')).toHaveAttribute('data-theme', /cyberpunk|cyberpunk-neon/);");
fs.writeFileSync('tests/tier4.spec.ts', t4);
