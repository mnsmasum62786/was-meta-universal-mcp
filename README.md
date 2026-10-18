# Meta Universal MCP (`was-meta-universal-mcp`)

A self-contained, cross-platform Model Context Protocol (MCP) server for Meta (Facebook). Exposes 1 master tool (`meta_universal_api`) allowing AI coding assistants (Claude Desktop, Cursor, Antigravity, VS Code, Zed, etc.) to call **any** Meta API endpoint—including the Marketing API (Ads, Campaigns, Insights, Pixels, Audiences), Graph API (Pages, Instagram, WhatsApp Business, Threads, Webhooks), and Business Management API. Built by Web Analytics Solution.

## Prerequisites

| | Required | How to install |
|---|---|---|
| **Node.js 18+** | running `npx` | Mac: `brew install node` · Windows: https://nodejs.org · Linux: `apt install nodejs npm` |
| **Git** | letting `npx` clone from GitHub | Mac: `brew install git` (or first `git --version` triggers Xcode tools) · Windows: https://git-scm.com · Linux: `apt install git` |
| **Meta Account / Business Manager** | to access API data | [Meta Business Suite](https://business.facebook.com/) |
| **Meta Access Token** | for authentication | Walked through below |

## Quick Start — 3 Steps

### Step 1 — Get a Meta Access Token

You can use either of the following token types:

- **Option A (Recommended for permanent production access): System User Token**
  1. Go to [Meta Business Settings](https://business.facebook.com/settings/).
  2. Navigate to **Users** > **System Users** and click **Add** (Admin system user recommended).
  3. Assign assets (Ad Accounts, Pages, Catalogs, Pixels, WhatsApp Accounts) with full control.
  4. Click **Generate New Token**, select your App, and check all required scopes (e.g. `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`, `pages_manage_posts`, `whatsapp_business_management`, `catalog_management`).
  5. Copy your non-expiring Access Token.

- **Option B (Fast testing): User Access Token**
  1. Go to [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
  2. Select your App and generate a User Token with your desired permissions.

*(Optional)* Find your **App Secret** under your Meta App Settings > Basic if you want automatic HMAC-SHA256 `appsecret_proof` calculation.

### Step 2 — Connect

Run the interactive authentication setup in your terminal:

```bash
npx -y github:mnsmasum62786/was-meta-universal-mcp auth
```

1. Paste your **Meta Access Token** when prompted.
2. *(Optional)* Paste your **App Secret** (or press Enter to skip).
3. The CLI will verify your token against the Meta API and save credentials locally at `~/.was-meta-universal-mcp/config.json` with strict `0600` permissions.

### Step 3 — Add to Your AI Client

Add the following configuration to your AI client's MCP configuration JSON file:

```json
{
  "mcpServers": {
    "Meta Universal MCP": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-meta-universal-mcp"]
    }
  }
}
```

#### Configuration File Locations by Client:
- **Claude Desktop (Mac)**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop (Windows)**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Cursor**: `~/.cursor/mcp.json` (or via Cursor Settings -> MCP)
- **Google Antigravity / Windsurf**: `~/.gemini/antigravity/mcp.json` or `~/.codeium/windsurf/mcp_config.json`

## What You Can Ask the AI

Since this MCP exposes a universal API tool, you can ask the AI to perform any action across Meta's entire platform:

### Marketing & Advertising
- *"List all ad accounts accessible to my token."*
- *"Show me all active campaigns in ad account `act_12345678` with their budgets and status."*
- *"Fetch performance insights for campaign `1202020202` for the last 30 days (impressions, clicks, spend, conversions, ROAS)."*
- *"Create a new custom audience in ad account `act_12345678` named 'High Value Leads'."*
- *"Check the Event Match Quality (EMQ) and diagnostics for Meta Pixel `987654321`."*

### Facebook Pages & Posts
- *"List all Facebook pages managed by my business."*
- *"Get recent post engagements and insights for page ID `11223344`."*
- *"Publish a text post to my Facebook page `11223344`."*

### Instagram Graph API
- *"Find the connected Instagram Business account for my Facebook page."*
- *"Fetch the latest 10 Instagram media posts with comment count and like count."*

### WhatsApp Business API & Webhooks
- *"List the registered phone numbers on my WhatsApp Business Account `55667788`."*
- *"Send a WhatsApp template message to `+1234567890`."*

## All Tools (1 Total)

| Category | Tools | Description |
|---|---|---|
| **Universal API Call** | `meta_universal_api` | Invoke ANY Meta (Facebook) API endpoint across Marketing API, Graph API, WhatsApp Business API, and Business Management API. Supports GET, POST, DELETE with full path/endpoint, query parameters, and JSON payload. |

## CLI Commands

You can run these commands directly via `npx -y github:mnsmasum62786/was-meta-universal-mcp <command>`:

- `auth` — Interactive prompt to connect or re-connect your Meta credentials.
- `status` — Show config file location and summary of saved credentials.
- `logout` — Delete the locally stored credentials file (`~/.was-meta-universal-mcp/config.json`).
- `help` — Print command line usage and environment variable options.

## Multi-Account Setup

You can bypass the local config file by setting environment variables in your client configuration. This allows running multiple Meta accounts or ad agencies simultaneously:

```json
{
  "mcpServers": {
    "Meta Ads - Client A": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-meta-universal-mcp"],
      "env": {
        "META_ACCESS_TOKEN": "EAAClientAToken...",
        "META_APP_SECRET": "secretA"
      }
    },
    "Meta Ads - Client B": {
      "command": "npx",
      "args": ["-y", "github:mnsmasum62786/was-meta-universal-mcp"],
      "env": {
        "META_ACCESS_TOKEN": "EAAClientBToken...",
        "META_APP_SECRET": "secretB"
      }
    }
  }
}
```

## Troubleshooting

### 1. "Meta Universal MCP — not configured yet"
- **Cause**: The MCP server was started before configuring credentials.
- **Fix**: Open your terminal and run `npx -y github:mnsmasum62786/was-meta-universal-mcp auth`.

### 2. "Token verification failed (HTTP 400 / 401)"
- **Cause**: The token expired, or lacked the required scopes.
- **Fix**: Ensure your System User has the correct assets and scopes assigned in Meta Business Settings, generate a new token, and run `auth` again.

### 3. Windows PowerShell Execution Policy Error
If you see an error like `npx.ps1 cannot be loaded because running scripts is disabled`:
- **Fix**: Run the following command in PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 4. Cache Issues after Updates
To force clear the npx cache and download the latest release:
- **Windows (PowerShell)**:
  ```powershell
  Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache" -ErrorAction SilentlyContinue
  npm cache clean --force
  ```
- **Mac / Linux**:
  ```bash
  rm -rf ~/.npm/_npx
  npm cache clean --force
  ```

## License

MIT License. Built by [Web Analytics Solution](https://webanalyticsbd.com/).
