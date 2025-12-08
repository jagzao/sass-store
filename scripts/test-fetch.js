
const http = require('http');

const url = 'http://localhost:3001/t/wondernails/clientes';

console.log(`Testing fetch to: ${url}`);

const req = http.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Body length:', data.length);
    console.log('First 100 chars:', data.substring(0, 100));
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.end();
