import { mkdir, writeFile, chmod, readFile, unlink } from 'node:fs/promises';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_BASE_URL, DEFAULT_API_VERSION } from './config.js';

export async function runAuthFlow() {
  console.log('\n=== Meta Universal MCP — Setup ===\n');
  console.log('You need a Meta Access Token:');
  console.log('  • Recommended: System User Token (from Business Settings -> System Users) for non-expiring access.');
  console.log('  • Or: User Access Token from https://developers.facebook.com/tools/explorer/\n');

  let token = process.env.META_ACCESS_TOKEN;
  let appSecret = process.env.META_APP_SECRET;

  const rl = readline.createInterface({ input, output });

  if (!token) {
    token = (await rl.question('Paste your Meta Access Token: ')).trim();
  }
  if (!appSecret) {
    appSecret = (await rl.question('Paste your App Secret (optional, press Enter to skip): ')).trim();
  }

  rl.close();

  if (!token) {
    throw new Error('Access Token is required.');
  }

  console.log('\nVerifying token with Meta API...');
  
  let verifiedIdentifier = '(unknown)';
  let verifyRes = await fetch(`${DEFAULT_BASE_URL}/${DEFAULT_API_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
  
  if (verifyRes.ok) {
    const me = await verifyRes.json();
    verifiedIdentifier = `${me.name || 'User'} (ID: ${me.id})`;
  } else {
    // If /me fails (e.g. System User token with restricted profile access), try /me/adaccounts or /app
    const altRes = await fetch(`${DEFAULT_BASE_URL}/${DEFAULT_API_VERSION}/app?fields=id,name&access_token=${encodeURIComponent(token)}`);
    if (altRes.ok) {
      const appData = await altRes.json();
      verifiedIdentifier = `App: ${appData.name || 'App'} (ID: ${appData.id})`;
    } else {
      // Test ad accounts endpoint for Marketing API tokens
      const adsRes = await fetch(`${DEFAULT_BASE_URL}/${DEFAULT_API_VERSION}/me/adaccounts?limit=1&access_token=${encodeURIComponent(token)}`);
      if (adsRes.ok) {
        verifiedIdentifier = 'System User / Marketing Account (Valid)';
      } else {
        const errText = await verifyRes.text();
        throw new Error(`Token verification failed (HTTP ${verifyRes.status}): ${errText}`);
      }
    }
  }

  console.log(`✓ Verified! Connected as: ${verifiedIdentifier}`);

  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  const payload = {
    access_token: token,
    app_secret: appSecret || null,
    saved_at: new Date().toISOString(),
  };

  await writeFile(CONFIG_FILE, JSON.stringify(payload, null, 2), { mode: 0o600 });
  try { await chmod(CONFIG_FILE, 0o600); } catch {}

  console.log(`\n✓ Credentials saved to ${CONFIG_FILE}\n`);
  console.log('Add this configuration to your AI client:\n');
  console.log(JSON.stringify({
    mcpServers: {
      'Meta Universal MCP': {
        command: 'npx',
        args: ['-y', 'github:mnsmasum62786/was-meta-universal-mcp'],
      },
    },
  }, null, 2));
}

export async function readConfigFile() {
  try {
    return JSON.parse(await readFile(CONFIG_FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function deleteConfigFile() {
  try {
    await unlink(CONFIG_FILE);
    return true;
  } catch (e) {
    if (e.code === 'ENOENT') return false;
    throw e;
  }
}
