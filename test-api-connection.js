/**
 * Simple API Connection Test
 * 
 * Tests if API is accessible on port 4000
 */

async function testApiConnection() {
  const baseUrl = 'http://localhost:4000';

  console.log('Testing API connection to:', baseUrl);
  console.log('---');

  try {
    // Test 1: Root endpoint
    console.log('Test 1: Connecting to root endpoint...');
    const response1 = await fetch(`${baseUrl}/`, {
      method: 'GET',
    });
    console.log(`  Status: ${response1.status} ${response1.statusText}`);
    console.log(`  Success: ${response1.status < 500}`);

    // Test 2: Non-existent endpoint (should return 404)
    console.log('\nTest 2: Testing non-existent endpoint...');
    const response2 = await fetch(`${baseUrl}/api/nonexistent`, {
      method: 'GET',
    });
    console.log(`  Status: ${response2.status} ${response2.statusText}`);
    console.log(`  Expected 404: ${response2.status === 404}`);

    // Test 3: Auth endpoint (should exist)
    console.log('\nTest 3: Testing auth endpoint...');
    const response3 = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
      }),
    });
    console.log(`  Status: ${response3.status} ${response3.statusText}`);
    console.log(`  Success: ${response3.status < 500}`);

    console.log('\n---');
    console.log('✅ API connection test completed');
    console.log('API is accessible on port 4000');
  } catch (error) {
    console.error('\n---');
    console.error('❌ API connection test failed');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('- API server is not running on port 4000');
    console.error('- Firewall is blocking the connection');
    console.error('- Port 4000 is already in use by another process');
    process.exit(1);
  }
}

testApiConnection();
