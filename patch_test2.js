const fs = require('fs');

let t1 = fs.readFileSync('tests/tier1.spec.ts', 'utf8');
t1 = t1.replace(/'cyberpunk-neon'/g, "'cyberpunk'");
fs.writeFileSync('tests/tier1.spec.ts', t1);

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/'cyberpunk-neon'/g, "'cyberpunk'");
t2 = t2.replace(/hsl\\(255, 22%, 7%\\)/g, "hsl(255, 22%, 7%)"); // fix just in case
t2 = t2.replace(/hsl\\(255, 20%, 4%\\)/g, "hsl(255, 20%, 4%)");
t2 = t2.replace(/#0a0a12/g, "hsl(255, 20%, 4%)"); // color might be rendered as hsl or rgb
t2 = t2.replace(/await expect\(page.locator\('body'\)\)\.toHaveCSS\('background-color', \/255, 20%, 4%|\#0a0a12\/\);/, "await expect(page.locator('body')).toHaveCSS('background-color', /255, 20%, 4%|10, 10, 18/);");
fs.writeFileSync('tests/tier2.spec.ts', t2);

let t3 = fs.readFileSync('tests/tier3.spec.ts', 'utf8');
t3 = t3.replace(/'cyberpunk-neon'/g, "'cyberpunk'");
fs.writeFileSync('tests/tier3.spec.ts', t3);

let t4 = fs.readFileSync('tests/tier4.spec.ts', 'utf8');
t4 = t4.replace(/'cyberpunk-neon'/g, "'cyberpunk'");
fs.writeFileSync('tests/tier4.spec.ts', t4);
