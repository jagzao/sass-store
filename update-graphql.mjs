import fs from 'fs';

// Read the file
const filePath = 'C:/Dev/Zo/sass-store/apps/api/graphql/resolvers.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of the withTenantContext call
content = content.replace(/withTenantContext\(db, tenant\.id, async \(db\) => \{/g, 'withTenantContext(db, tenant.id, null, async (db) => {');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Updated withTenantContext calls in GraphQL resolvers');