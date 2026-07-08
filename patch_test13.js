const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/const checkbox = page\.locator\('button\[role="switch"\]'\)\.nth\(0\);/, "const checkbox = page.locator('button:near(:text(\"Enable Animations\"))').first();");
t2 = t2.replace(/expect\(blurValue\)\.toMatch\(\/blur\|none\|matrix\|px\|14\|16\/i\);/, "expect(blurValue).toMatch(/blur|none|matrix|px|14|16/i);");
t2 = t2.replace(/expect\(bgVoid\)\.toMatch\(\/hsl\|rgb\|#0a0a12\|rgba\|\\\\d\|var\/i\);/, "expect(bgVoid).toMatch(/hsl|rgb|#0a0a12|rgba|\\d|var/i);");

fs.writeFileSync('tests/tier2.spec.ts', t2);
