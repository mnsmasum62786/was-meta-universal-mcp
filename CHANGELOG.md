# Changelog

## 1.0.0 — 2026-10-18

### New Features
- Initial release of `was-meta-universal-mcp` — Universal Meta (Facebook) API MCP server.
- Interactive authentication (`auth` command) supporting Meta User and System User Access Tokens.
- Single master tool `meta_universal_api` (Universal API Call) to access any Meta API:
  - Marketing API (Ad Accounts, Campaigns, Ad Sets, Ads, Insights, Custom Audiences, Conversions API, Pixels, Catalogs).
  - Graph API (Facebook Pages, Instagram Graph API, WhatsApp Business API, Threads API, Webhooks).
  - Business Management API (Businesses, Owned Pages, Client Ad Accounts, System Users).
- Optional automatic HMAC-SHA256 `appsecret_proof` generation when App Secret is configured.
- Local 0600 secure credential storage at `~/.was-meta-universal-mcp/config.json`.
- Environment variable overrides (`META_ACCESS_TOKEN`, `META_APP_SECRET`, `META_BASE_URL`, `META_API_VERSION`).
- Response truncation at 60 KB and vendor-specific machine-readable error decoding.
- Full Windows, Mac, and Linux compatibility with ESM URL wrapping.
