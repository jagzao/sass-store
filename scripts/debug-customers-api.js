const fetch = require('node-fetch');

async function debugCustomersAPI() {
  const tenantSlug = process.argv[2] || 'wondernails';
  const baseUrl = 'http://localhost:3001';
  
  console.log(`🔍 Debugging customers API for tenant: ${tenantSlug}`);
  console.log('=====================================');
  
  // Step 1: Check if tenant exists
  try {
    console.log('\n1. Checking if tenant exists...');
    const tenantResponse = await fetch(`${baseUrl}/api/tenants/${tenantSlug}`);
    console.log(`   Status: ${tenantResponse.status}`);
    
    if (tenantResponse.ok) {
      const tenantData = await tenantResponse.json();
      console.log(`   Tenant found: ${tenantData.name}`);
      console.log(`   Tenant ID: ${tenantData.id}`);
      console.log(`   Mode: ${tenantData.mode}`);
    } else {
      const errorText = await tenantResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
  } catch (error) {
    console.log(`   Failed to fetch tenant: ${error.message}`);
    return;
  }
  
  // Step 2: Check customers API
  try {
    console.log('\n2. Testing customers API...');
    const customersResponse = await fetch(`${baseUrl}/api/tenants/${tenantSlug}/customers`);
    console.log(`   Status: ${customersResponse.status}`);
    
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      console.log(`   Customers count: ${customersData.count}`);
      console.log(`   First customer: ${customersData.customers[0]?.name || 'None'}`);
    } else {
      const errorText = await customersResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   Failed to fetch customers: ${error.message}`);
  }
  
  // Step 3: Check database connection
  try {
    console.log('\n3. Checking database connection...');
    const dbResponse = await fetch(`${baseUrl}/api/health/db`);
    console.log(`   Status: ${dbResponse.status}`);
    
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log(`   Database status: ${dbData.status}`);
    } else {
      const errorText = await dbResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   Failed to check database: ${error.message}`);
  }
}

debugCustomersAPI().catch(console.error);