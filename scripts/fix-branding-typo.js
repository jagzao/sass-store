const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'apps', 'web', 'lib', 'db', 'schema.ts');

// Read the schema file
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Replace 'branding' with 'branding' (remove 'i')
// Use a simpler regex pattern
schemaContent = schemaContent.replace(/branding: jsonb\('branding'\)/g, "branding: jsonb('branding')");

// Write the modified schema back to the file
fs.writeFileSync(schemaPath, schemaContent, 'utf8');

console.log('✅ Fixed branding typo in schema.ts');
console.log('Changed: branding -> branding');
