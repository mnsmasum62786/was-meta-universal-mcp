#!/usr/bin/env node

/**
 * Meta Universal MCP — CLI router
 *
 *   was-meta-universal-mcp          Start the MCP server (used by AI client via stdio)
 *   was-meta-universal-mcp auth     Connect / re-connect credentials
 *   was-meta-universal-mcp logout   Delete saved credentials
 *   was-meta-universal-mcp status   Show whether credentials are saved and when
 *   was-meta-universal-mcp help     Show usage
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { CONFIG_FILE } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || '').toLowerCase();

// EVERY dynamic import() MUST be wrapped in pathToFileURL(...).href
// Otherwise Windows Node 24+ throws ERR_UNSUPPORTED_ESM_URL_SCHEME
if (cmd === 'auth') {
  const { runAuthFlow } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  try {
    await runAuthFlow();
    process.exit(0);
  } catch (err) {
    console.error('\nAuth failed:', err?.message || err);
    process.exit(1);
  }
} else if (cmd === 'logout') {
  const { deleteConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const deleted = await deleteConfigFile();
  console.log(deleted ? `Removed ${CONFIG_FILE}` : 'No saved credentials to remove.');
  process.exit(0);
} else if (cmd === 'status') {
  const { readConfigFile } = await import(pathToFileURL(join(__dirname, 'auth.js')).href);
  const cfg = await readConfigFile();
  if (!cfg) {
    console.log('Not configured. Run `npx -y github:mnsmasum62786/was-meta-universal-mcp auth` to connect.');
  } else {
    console.log(`Config:     ${CONFIG_FILE}`);
    console.log(`Saved at:   ${cfg.saved_at || '(unknown)'}`);
    console.log(`App Secret: ${cfg.app_secret ? 'Configured' : 'Not configured'}`);
  }
  process.exit(0);
} else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(`
Meta Universal MCP — CLI

Usage:
  npx -y github:mnsmasum62786/was-meta-universal-mcp          Start MCP server (stdio)
  npx -y github:mnsmasum62786/was-meta-universal-mcp auth     Connect / re-connect
  npx -y github:mnsmasum62786/was-meta-universal-mcp status   Show config summary
  npx -y github:mnsmasum62786/was-meta-universal-mcp logout   Delete credentials
  npx -y github:mnsmasum62786/was-meta-universal-mcp help     This message

Environment variable overrides (take precedence over saved config):
  META_ACCESS_TOKEN            Your Meta User or System User Access Token
  META_APP_SECRET              Your Meta App Secret (optional)
  META_BASE_URL                Base URL override (defaults to https://graph.facebook.com)
  META_API_VERSION             API version override (defaults to v22.0)

Requires Node 18+.
`);
  process.exit(0);
} else {
  // Default action: start the MCP stdio server
  await import(pathToFileURL(join(__dirname, 'server.js')).href);
}
