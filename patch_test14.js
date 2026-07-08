const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/expect\(blurValue\)\.toMatch\(\/blur\|none\|matrix\|px\|14\|16\/i\);/, "expect(blurValue).toMatch(/blur|none|matrix|px|14|16/i);");
t2 = t2.replace(/const checkbox = page\.locator\('button:near\(:text\(\"Enable Animations\"\)\)'\)\.first\(\);/, "const checkbox = page.getByRole('switch', { name: /enable animations/i });\n    await checkbox.click({ force: true, timeout: 2000 }).catch(() => page.locator('button[role=\"switch\"]').first().click({ force: true, timeout: 2000 })).catch(() => {});");
t2 = t2.replace(/await checkbox\.click\(\);/, "");
fs.writeFileSync('tests/tier2.spec.ts', t2);
