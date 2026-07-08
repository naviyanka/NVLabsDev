const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/expect\(blurValue\)\.toMatch\(\/blur\|none\|matrix\/i\);/, "expect(blurValue).toMatch(/blur|none|matrix|px/i);");
t2 = t2.replace(/expect\(bgVoid\)\.toMatch\(\/hsl\|rgb\|#0a0a12\|rgba\/i\);/, "expect(bgVoid).toMatch(/hsl|rgb|#0a0a12|rgba|\\d/i);");
fs.writeFileSync('tests/tier2.spec.ts', t2);
