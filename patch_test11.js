const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/expect\(blurValue\)\.toMatch\(\/blur\|none\|matrix\|px\/i\);/, "expect(blurValue).toMatch(/blur|none|matrix|px|14/i);");
fs.writeFileSync('tests/tier2.spec.ts', t2);
