const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getJwtKey() {
  if (process.env.JWT_KEY) {
    return process.env.JWT_KEY;
  }
  
  try {
    const userSecretsId = 'f0c45f8c-2142-44b8-befd-71ca8c8213c9';
    let secretsPath = '';
    if (process.platform === 'win32') {
      secretsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'UserSecrets', userSecretsId, 'secrets.json');
    } else {
      secretsPath = path.join(os.homedir(), '.microsoft', 'usersecrets', userSecretsId, 'secrets.json');
    }
    
    if (fs.existsSync(secretsPath)) {
      let content = fs.readFileSync(secretsPath, 'utf8');
      content = content.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM
      const secrets = JSON.parse(content);
      if (secrets['Jwt:Key']) {
        return secrets['Jwt:Key'];
      }
    }
  } catch (e) {
    console.error("Error loading user secrets:", e);
  }
  
  return 'nexus-super-secret-key-1234567890-very-secure';
}

function generateToken() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "OrgAdmin",
    "unique_name": "OrgAdmin",
    "name": "OrgAdmin",
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": "Administrators",
    "role": "Administrators",
    iss: 'Nexus',
    aud: 'NexusUsers',
    nbf: now - 60,
    exp: now + 36000,
    iat: now
  };
  
  const secret = getJwtKey();
  const headerStr = base64UrlEncode(JSON.stringify(header));
  const payloadStr = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${headerStr}.${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${signatureInput}.${signature}`;
}

async function run() {
  const token = generateToken();
  console.log("Using token key:", getJwtKey());
  console.log("Token:", token);
  
  try {
    const res = await fetch("http://localhost:5010/api/settings", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Body:", body);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
