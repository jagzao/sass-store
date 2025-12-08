
// const fetch = require('node-fetch'); // Native fetch in Node 18+

async function debugApi() {
  const url = 'http://localhost:4000/api/tenants/wondernails/customers/08bbc488-117e-4712-9479-825c4f916deb/visits';
  console.log(`Fetching ${url}...`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    console.log('Response Body:');
    console.log(text);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

debugApi();
