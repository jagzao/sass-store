import fs from 'fs';
import path from 'path';

// Define the function to update withTenantContext calls in files recursively
function updateWithTenantContextInDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules
      if (file !== 'node_modules') {
        updateWithTenantContextInDirectory(filePath);
      }
    } else if (path.extname(file) === '.ts' || path.extname(file) === '.tsx') {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        // Update withTenantContext calls that have 3 parameters to include null as 3rd parameter
        const pattern = /withTenantContext\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*async\s*\(/g;
        let match;
        
        while ((match = pattern.exec(content)) !== null) {
          // Check if this specific call already has 4 parameters
          const callStart = match.index;
          const callEnd = content.indexOf('}', callStart);
          const callSubstring = content.substring(callStart, callEnd + 1);
          
          // Count the number of parameters by looking at the function call
          const openingParenIndex = callStart + 'withTenantContext('.length;
          const closingParenIndex = findClosingParen(content, openingParenIndex);
          
          if (closingParenIndex !== -1) {
            const fullCall = content.substring(callStart, closingParenIndex + 1);
            const paramCount = countParameters(fullCall);
            
            if (paramCount === 3) {  // It has 3 parameters: db, tenantId, async fn
              // Find the position to insert the null parameter
              const dbParamEnd = content.indexOf(',', openingParenIndex);
              if (dbParamEnd !== -1) {
                const tenantParamEnd = content.indexOf(',', dbParamEnd + 1);
                if (tenantParamEnd !== -1) {
                  content = content.substring(0, tenantParamEnd + 1) + 
                           ' null, ' + 
                           content.substring(tenantParamEnd + 1);
                  updated = true;
                }
              }
            }
          }
        }
        
        if (updated) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated withTenantContext calls in: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
      }
    }
  }
}

// Helper function to find the matching closing parenthesis
function findClosingParen(str, startPos) {
  let parenCount = 0;
  for (let i = startPos; i < str.length; i++) {
    if (str[i] === '(') {
      parenCount++;
    } else if (str[i] === ')') {
      parenCount--;
      if (parenCount === 0) {
        return i;
      }
    }
  }
  return -1;
}

// Helper function to count parameters in a function call
function countParameters(callStr) {
  let parenCount = 0;
  let paramCount = 0;
  let inString = false;
  let stringChar = null;
  let lastChar = '';
  
  for (let i = 0; i < callStr.length; i++) {
    const char = callStr[i];
    
    // Handle string literals
    if ((char === '"' || char === "'" || char === '`') && lastChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    } else if (char === '(' && !inString) {
      parenCount++;
      if (parenCount === 1) paramCount = 1; // First parameter exists
    } else if (char === ')' && !inString) {
      parenCount--;
      if (parenCount === 0) break;
    } else if (char === ',' && !inString && parenCount === 1) {
      paramCount++;
    }
    
    lastChar = char;
  }
  
  return paramCount;
}

// Run the update for the api directory
const apiDir = 'C:/Dev/Zo/sass-store/apps/api';
updateWithTenantContextInDirectory(apiDir);

console.log('withTenantContext updates completed.');