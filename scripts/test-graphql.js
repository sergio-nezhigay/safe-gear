/**
 * test-graphql.js
 * Runs sample Shopify Admin GraphQL queries to verify API access.
 *
 * Usage: npm run test-graphql
 * Requires SHOPIFY_ACCESS_TOKEN to be set in .env (run get-token.js first).
 */

require('dotenv').config();

const { SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN, SHOPIFY_API_VERSION = '2025-01' } = process.env;

if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('SHOPIFY_ACCESS_TOKEN is not set. Run "npm run get-token" first.');
  process.exit(1);
}

if (!SHOPIFY_STORE) {
  console.error('SHOPIFY_STORE is not set in .env');
  process.exit(1);
}

const endpoint = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
const headers = {
  'Content-Type': 'application/json',
  'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
};

async function graphql(query, variables = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

async function main() {
  console.log(`\n=== Shopify Admin GraphQL Test ===`);
  console.log(`Store:   ${SHOPIFY_STORE}`);
  console.log(`API:     ${SHOPIFY_API_VERSION}\n`);

  // Query 1: Shop info
  console.log('--- Query 1: Shop info ---');
  const shopData = await graphql(`{
    shop {
      name
      myshopifyDomain
      plan { displayName }
      primaryDomain { url }
    }
  }`);
  console.log(JSON.stringify(shopData.shop, null, 2));

  // Query 2: First 5 products
  console.log('\n--- Query 2: First 5 products ---');
  const productsData = await graphql(`{
    products(first: 5) {
      edges {
        node {
          id
          title
          status
          totalInventory
        }
      }
    }
  }`);
  const products = productsData.products.edges.map((e) => e.node);
  console.log(JSON.stringify(products, null, 2));
  console.log(`\nTotal shown: ${products.length} product(s)`);

  // Query 3: First 3 orders
  console.log('\n--- Query 3: First 3 orders ---');
  const ordersData = await graphql(`{
    orders(first: 3) {
      edges {
        node {
          id
          name
          displayFinancialStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          createdAt
        }
      }
    }
  }`);
  const orders = ordersData.orders.edges.map((e) => e.node);
  console.log(JSON.stringify(orders, null, 2));
  console.log(`\nTotal shown: ${orders.length} order(s)`);

  console.log('\n✓ All queries succeeded.\n');
}

main().catch((err) => {
  console.error('\nQuery failed:', err.message);
  process.exit(1);
});
