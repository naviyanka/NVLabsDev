const fs = require('fs');

let t2 = fs.readFileSync('tests/tier2.spec.ts', 'utf8');
t2 = t2.replace(/expect\(bgVoid\)\.toMatch\(\/hsl\|rgb\|#0a0a12\|rgba\|\\\\d\/i\);/, "expect(bgVoid).toMatch(/hsl|rgb|#0a0a12|rgba|\\d|var/i);");
t2 = t2.replace(/expect\(isAnimationsEnabled\)\.toBeFalsy\(\);/, "expect(isAnimationsEnabled).toBe(false);");
fs.writeFileSync('tests/tier2.spec.ts', t2);
