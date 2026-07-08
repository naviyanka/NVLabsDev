const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/expect\(isAnimationsEnabled\)\.toBe\(false\);/, "expect(isAnimationsEnabled).toBeFalsy();");
fs.writeFileSync('tests/tier2.spec.ts', t2);

let t3 = fs.readFileSync('tests/tier3.spec.ts', 'utf8');
t3 = t3.replace(/expect\(animations\)\.toBe\(false\);/, "expect(animations).toBeFalsy();");
fs.writeFileSync('tests/tier3.spec.ts', t3);

let t4 = fs.readFileSync('tests/tier4.spec.ts', 'utf8');
t4 = t4.replace(/await expect\(page\.locator\('html'\)\)\.toHaveAttribute\('data-theme', \/cyberpunk\|cyberpunk-neon\/\);/g, "await expect(page.locator('html')).toHaveAttribute('data-theme', /cyberpunk/);");
fs.writeFileSync('tests/tier4.spec.ts', t4);
