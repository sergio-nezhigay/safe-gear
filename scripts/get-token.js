/**
 * get-token.js
 * Starts a local OAuth callback server and exchanges the authorization code
 * for a Shopify Admin API access token, then saves it to .env.
 *
 * Usage: npm run get-token
 *
 * Prerequisites:
 *   1. Fill SHOPIFY_API_SECRET in .env
 *   2. Add http://localhost:3000/callback as a redirect URI in Partner Dashboard:
 *      dev.shopify.com → your app → Configuration → URLs
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.resolve(__dirname, '../.env');

const {
  SHOPIFY_STORE,
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  SHOPIFY_REDIRECT_URI,
} = process.env;

// Validate required env vars
const missing = ['SHOPIFY_STORE', 'SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'SHOPIFY_SCOPES', 'SHOPIFY_REDIRECT_URI']
  .filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const PORT = new URL(SHOPIFY_REDIRECT_URI).port || 3000;
const state = crypto.randomBytes(16).toString('hex');

const authUrl =
  `https://${SHOPIFY_STORE}/admin/oauth/authorize` +
  `?client_id=${SHOPIFY_API_KEY}` +
  `&scope=${encodeURIComponent(SHOPIFY_SCOPES)}` +
  `&redirect_uri=${encodeURIComponent(SHOPIFY_REDIRECT_URI)}` +
  `&state=${state}`;

console.log('\n=== Shopify OAuth Token Exchange ===\n');
console.log('Open this URL in your browser to authorize the app:\n');
console.log(authUrl);
console.log(`\nWaiting for OAuth callback on port ${PORT}...\n`);

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  if (reqUrl.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const returnedState = reqUrl.searchParams.get('state');
  const code = reqUrl.searchParams.get('code');
  const error = reqUrl.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h2>Authorization denied: ${error}</h2><p>You can close this tab.</p>`);
    console.error(`\nAuthorization denied: ${error}`);
    server.close();
    process.exit(1);
  }

  if (returnedState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h2>State mismatch — possible CSRF. Try again.</h2>');
    console.error('\nState mismatch. Aborting.');
    server.close();
    process.exit(1);
  }

  // Exchange code for access token
  const body = JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code });
  const options = {
    hostname: SHOPIFY_STORE,
    path: '/admin/oauth/access_token',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  };

  const tokenReq = https.request(options, (tokenRes) => {
    let data = '';
    tokenRes.on('data', (chunk) => { data += chunk; });
    tokenRes.on('end', () => {
      let parsed;
      try { parsed = JSON.parse(data); } catch {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h2>Failed to parse token response.</h2>');
        console.error('Failed to parse response:', data);
        server.close();
        process.exit(1);
      }

      if (!parsed.access_token) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h2>Error: ${parsed.error_description || JSON.stringify(parsed)}</h2>`);
        console.error('Token exchange failed:', parsed);
        server.close();
        process.exit(1);
      }

      // Save token to .env
      let envContent = fs.readFileSync(ENV_PATH, 'utf8');
      if (/^SHOPIFY_ACCESS_TOKEN=.*/m.test(envContent)) {
        envContent = envContent.replace(/^SHOPIFY_ACCESS_TOKEN=.*/m, `SHOPIFY_ACCESS_TOKEN=${parsed.access_token}`);
      } else {
        envContent += `\nSHOPIFY_ACCESS_TOKEN=${parsed.access_token}`;
      }
      fs.writeFileSync(ENV_PATH, envContent);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Access token saved to .env!</h2><p>You can close this tab and run <code>npm run test-graphql</code>.</p>');

      console.log('\n✓ Access token saved to .env');
      console.log(`  Scopes granted: ${parsed.scope}`);
      console.log('\nRun "npm run test-graphql" to test GraphQL queries.\n');

      server.close();
      process.exit(0);
    });
  });

  tokenReq.on('error', (err) => {
    console.error('Token request error:', err.message);
    server.close();
    process.exit(1);
  });

  tokenReq.write(body);
  tokenReq.end();
});

server.listen(PORT, () => {});
