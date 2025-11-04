/**
 * Direct test of Resend email service
 * Run: node scripts/test-resend-direct.js
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const testEmail = process.argv[2] || 'jagzao@gmail.com';

console.log('\n🔍 Testing Resend Configuration\n');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Found' : '❌ Not found');
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || '❌ Not set');
console.log('Target email:', testEmail);
console.log('\n-----------------------------------\n');

async function testResend() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment');
      process.exit(1);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('📧 Sending test email via Resend...\n');

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: testEmail,
      subject: 'Test - Password Reset',
      html: `
        <h1>Test Email from Resend</h1>
        <p>This is a test email to verify Resend integration.</p>
        <p>If you're seeing this, the email service is working!</p>
      `,
    });

    if (error) {
      console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log('\nResend Response:', JSON.stringify(data, null, 2));
    console.log('\n✅ Check your email inbox at:', testEmail);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testResend();
