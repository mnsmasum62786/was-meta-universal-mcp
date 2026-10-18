import { homedir } from 'node:os';
import { join } from 'node:path';

export const CONFIG_DIR = join(homedir(), '.was-meta-universal-mcp');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export const DEFAULT_BASE_URL = 'https://graph.facebook.com';
export const DEFAULT_API_VERSION = 'v22.0';
