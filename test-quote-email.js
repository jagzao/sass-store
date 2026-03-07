// Test script for quote email functionality
const { sendQuoteEmail } = require('./apps/web/lib/email/email-service.ts');

async function testQuoteEmail() {
  try {
    console.log('Testing quote email functionality...');
    
    const testParams = {
      to: 'test@example.com',
      quoteNumber: 'Q-TEST-001',
      customerName: 'Cliente de Prueba',
      totalAmount: 299.99,
      validityDays: 15,
      items: [
        {
          name: 'Servicio de Prueba',
          description: 'Descripción del servicio de prueba',
          quantity: 1,
          unitPrice: 199.99,
          subtotal: 199.99
        },
        {
          name: 'Producto de Prueba',
          description: 'Descripción del producto de prueba',
          quantity: 1,
          unitPrice: 100.00,
          subtotal: 100.00
        }
      ],
      tenantName: 'SaaS Store',
      tenantColor: '#4F46E5'
    };

    console.log('Sending test email with params:', JSON.stringify(testParams, null, 2));
    
    const result = await sendQuoteEmail(testParams);
    
    console.log('✅ Email sent successfully:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Check if it's a configuration error
    if (error.message.includes('RESEND_API_KEY')) {
      console.log('\n💡 This is a configuration error. To fix it:');
      console.log('1. Make sure RESEND_API_KEY is set in your .env.local file');
      console.log('2. Make sure RESEND_FROM_EMAIL is set in your .env.local file');
      console.log('3. Make sure the API key is valid and has email sending permissions');
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testQuoteEmail().then((result) => {
  console.log('\n=== Test Result ===');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✅ Quote email functionality is working correctly!');
    process.exit(0);
  } else {
    console.log('\n❌ Quote email functionality failed!');
    process.exit(1);
  }
}).catch((error) => {
  console.error('❌ Unexpected error during test:', error);
  process.exit(1);
});