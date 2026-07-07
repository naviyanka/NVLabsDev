import { expect, Page } from '@playwright/test';
import * as crypto from 'crypto';

export function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function generateToken(): string {
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
  
  const secret = 'nexus-super-secret-key-1234567890-very-secure';
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

export async function loginAndGoToSettings(page: Page): Promise<void> {
  const token = generateToken();
  await page.goto('/login');
  await page.evaluate((jwt) => {
    localStorage.setItem('nexus_token', jwt);
  }, token);
  
  // Start waiting for the settings GET request before navigating
  const settingsPromise = page.waitForResponse(resp => resp.url().includes('/api/settings') && resp.request().method() === 'GET');
  await page.goto('/settings');
  await settingsPromise; // ensure initial settings are loaded so they don't overwrite our clicks later
  
  await expect(page.locator('h1')).toHaveText('Global Settings');
  await page.locator('aside button').getByText('Appearance').click();
}
