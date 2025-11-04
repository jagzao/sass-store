/**
 * Test script for forgot password email functionality
 * Run: node scripts/test-forgot-password-email.js
 */

const testEmail = process.argv[2] || 'test@example.com';
const tenantSlug = process.argv[3] || 'demo';

console.log('\n📧 Testing Forgot Password Email\n');
console.log(`Email: ${testEmail}`);
console.log(`Tenant: ${tenantSlug}`);
console.log('\n-----------------------------------\n');

async function testForgotPassword() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        tenantSlug: tenantSlug,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Request failed:', data);
      process.exit(1);
    }

    console.log('✅ Request successful!');
    console.log('\nResponse:', JSON.stringify(data, null, 2));

    if (data.resetLink) {
      console.log('\n🔗 Reset Link (development only):');
      console.log(data.resetLink);
    }

    console.log('\n✅ Test completed! Check your email inbox.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testForgotPassword();
