import { test, expect } from '@playwright/test';
import { execSync, spawn } from 'child_process';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function getJwtKey(): string {
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

function generateToken(): string {
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

function getBackendPid(): number | null {
  try {
    const output = execSync('netstat -ano').toString();
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes(':5010') && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pidStr = parts[parts.length - 1];
        const pid = parseInt(pidStr, 10);
        if (!isNaN(pid)) {
          return pid;
        }
      }
    }
  } catch (e) {
    console.error('Failed to get backend PID:', e);
  }
  return null;
}

function killBackend() {
  const pid = getBackendPid();
  if (pid) {
    console.log(`Killing backend process with PID: ${pid}`);
    try {
      execSync(`taskkill /F /PID ${pid}`);
      console.log('Backend killed successfully.');
    } catch (e) {
      console.error(`Failed to kill PID ${pid}:`, e);
    }
  } else {
    console.log('No backend running on port 5010.');
  }
}

async function waitForBackend(timeoutMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await new Promise<number>((resolve, reject) => {
        const req = http.get('http://127.0.0.1:5010/api/health', (response) => {
          resolve(response.statusCode || 0);
        });
        req.on('error', (err) => reject(err));
        req.end();
      });
      if (res === 200) {
        return true;
      }
    } catch (e) {
      // Ignore and wait
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}
async function navigateClientSide(page: any, path: string) {
  await page.evaluate((p: string) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

test.describe('Frontend Resiliency to Backend Outages', () => {
  test.beforeEach(async ({ page }) => {
    // Inject local token before page loads to bypass login
    const token = generateToken();
    await page.addInitScript((t) => {
      window.localStorage.setItem('nexus_token', t);
    }, token);

    // Mock theme to always be 'dark' so the status badge is rendered in the header
    await page.route('**/api/settings', async (route) => {
      try {
        const response = await route.fetch();
        const json = await response.json();
        json.theme = 'dark';
        await route.fulfill({ json });
      } catch (e) {
        await route.fulfill({ json: { theme: 'dark' } });
      }
    });

    // Ensure backend is running before test
    const pid = getBackendPid();
    if (!pid) {
      console.log('Starting backend for test...');
      spawn('dotnet', ['run', '--project', 'src/Nexus.Gateway'], {
        shell: true,
        stdio: 'ignore'
      });
      await waitForBackend();
    }
  });

  test('should handle backend outage and recovery gracefully', async ({ page }) => {
    // 1. Go to the dashboard/root page
    await page.goto('/');

    // Check status badge displays LIVE (green)
    const statusBadge = page.locator('header').getByText('LIVE');
    await expect(statusBadge).toBeVisible({ timeout: 15000 });

    // 2. Kill the backend process
    console.log('Simulating backend outage...');
    killBackend();

    // Verify status badge turns to DEAD (red) and toast is displayed
    const deadBadge = page.locator('header').getByText('DEAD');
    await expect(deadBadge).toBeVisible({ timeout: 15000 });

    const offlineToast = page.locator('li[data-sonner-toast]').getByText('Connection to backend lost. Running in offline mode.').first();
    await expect(offlineToast).toBeVisible({ timeout: 15000 });

    // 3. Verify navigation to other pages works without React crashes
    console.log('Navigating to users page...');
    await navigateClientSide(page, '/users');
    // Header or page layout should still be there
    await expect(page.locator('h1')).toContainText('Local Users & Groups', { timeout: 10000 });

    console.log('Navigating to certificates page...');
    await navigateClientSide(page, '/certificates');
    await expect(page.locator('h1')).toContainText('Certificates', { timeout: 10000 });

    // 4. Verify attempting a backend action displays toast notification
    console.log('Triggering backend action while offline...');
    await page.evaluate(() => {
      fetch('/api/plugins/some-plugin/run', { method: 'POST' }).catch(() => {});
    });

    const actionFailedToast = page.locator('li[data-sonner-toast]').getByText('Backend is dead/unreachable. Action failed.').first();
    await expect(actionFailedToast).toBeVisible({ timeout: 15000 });

    // 5. Restart the backend
    console.log('Restarting backend...');
    spawn('dotnet', ['run', '--project', 'src/Nexus.Gateway'], {
      shell: true,
      stdio: 'ignore'
    });
    
    const restarted = await waitForBackend();
    expect(restarted).toBe(true);

    // Verify status badge turns back to LIVE (green)
    await expect(statusBadge).toBeVisible({ timeout: 35000 });

    const onlineToast = page.locator('li[data-sonner-toast]').getByText('Backend connection restored.').first();
    await expect(onlineToast).toBeVisible({ timeout: 20000 });
  });
});
