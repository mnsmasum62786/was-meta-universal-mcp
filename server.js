#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { CONFIG_FILE, DEFAULT_BASE_URL, DEFAULT_API_VERSION } from './config.js';

let saved = {};
try { saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8')); } catch {}

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || saved.access_token;
const APP_SECRET = process.env.META_APP_SECRET || saved.app_secret;
const BASE_URL = (process.env.META_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const API_VERSION = process.env.META_API_VERSION || DEFAULT_API_VERSION;

if (!ACCESS_TOKEN) {
  console.error(
    'Meta Universal MCP — not configured yet.\n\n' +
    'Run:  npx -y github:mnsmasum62786/was-meta-universal-mcp auth\n'
  );
  process.exit(1);
}

function computeAppSecretProof(token, secret) {
  if (!secret || !token) return null;
  return createHmac('sha256', secret).update(token).digest('hex');
}

// Universal API caller for Meta Graph & Marketing API
async function callMetaApi(method = 'GET', endpoint, body, queryParams = {}) {
  let url;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = new URL(endpoint);
  } else {
    const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const pathWithVersion = cleanPath.startsWith(`/${API_VERSION}`) ? cleanPath : `/${API_VERSION}${cleanPath}`;
    url = new URL(`${BASE_URL}${pathWithVersion}`);
  }

  // Inject authentication credentials
  url.searchParams.set('access_token', ACCESS_TOKEN);
  const proof = computeAppSecretProof(ACCESS_TOKEN, APP_SECRET);
  if (proof) {
    url.searchParams.set('appsecret_proof', proof);
  }

  // Inject additional query parameters
  if (queryParams && typeof queryParams === 'object') {
    for (const [k, v] of Object.entries(queryParams)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
    }
  }

  const headers = {
    'Accept': 'application/json',
  };

  let requestBody;
  if (body) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: requestBody,
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok || (parsed && parsed.error)) {
    const errMsg = parsed?.error?.message || parsed?.message || `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }

  return parsed;
}

function asTextResult(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const MAX = 60000;
  if (text.length > MAX) {
    return {
      content: [{
        type: 'text',
        text: text.slice(0, MAX) + `\n\n... [truncated ${text.length - MAX} chars; narrow your fields, filtering, or use pagination]`,
      }],
    };
  }
  return { content: [{ type: 'text', text }] };
}

function asError(err) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'Meta API error:\n' + JSON.stringify({
        message: err?.message || String(err),
        status: err?.status ?? null,
        vendor_error: err?.body?.error ?? null,
        raw: err?.body ?? null,
      }, null, 2),
    }],
  };
}

const tools = [
  {
    name: 'meta_universal_api',
    description: 'Universal API Call: Invoke ANY Meta (Facebook) API endpoint across Marketing API (Ads, Campaigns, AdSets, Insights, Audiences, Pixels, Catalogs), Graph API (Pages, Instagram, Threads, WhatsApp Business, Webhooks, Developer Apps, User Profiles, Groups), and Business Management API. Supports GET, POST, DELETE with full path/endpoint, query parameters, and JSON body.',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'The endpoint path (e.g. "/act_{ad_account_id}/insights", "/me/adaccounts", "/{page_id}/feed", "/{pixel_id}/events") or full URL.',
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          default: 'GET',
          description: 'HTTP method (default: GET)',
        },
        params: {
          type: 'object',
          description: 'Query string parameters (e.g. fields, date_preset, level, time_range, limit, filtering, summary).',
        },
        body: {
          type: 'object',
          description: 'JSON request payload for POST requests (e.g. creating campaigns, ads, audiences, posts, webhooks).',
        },
      },
      required: ['endpoint'],
    },
  },
];

async function handleCall(name, args) {
  if (name === 'meta_universal_api') {
    return asTextResult(await callMetaApi(args.method || 'GET', args.endpoint, args.body, args.params));
  }
  throw new Error(`Unknown tool: ${name}`);
}

const server = new Server(
  { name: 'was-meta-universal-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handleCall(req.params.name, req.params.arguments || {});
  } catch (err) {
    return asError(err);
  }
});

await server.connect(new StdioServerTransport());
console.error(`was-meta-universal-mcp v1.0.0 ready — Universal Meta API tool loaded`);
