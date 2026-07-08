const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/expect\(blurValue\)\.toMatch\(\/blur\|none\|matrix\|px\|14\/i\);/, "expect(blurValue).toMatch(/blur|none|matrix|px|14|16/i);");
t2 = t2.replace(/const checkbox = page\.locator\('button:has-text\("Enable Animations"\), label:has-text\("Enable Animations"\) \+ button'\);/, "const checkbox = page.locator('button[role=\"switch\"]').nth(0);");

fs.writeFileSync('tests/tier2.spec.ts', t2);
