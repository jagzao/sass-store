import fs from 'fs';
import path from 'path';

// Define the function to update imports in files recursively
function updateImportsInDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules
      if (file !== 'node_modules') {
        updateImportsInDirectory(filePath);
      }
    } else if (path.extname(file) === '.ts' || path.extname(file) === '.tsx') {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        // Update validateApiKey import
        const oldApiKeyImport = 'import { validateApiKey } from "@/lib/auth";';
        const newApiKeyImport = 'import { validateApiKey } from "@sass-store/config";';
        if (content.includes(oldApiKeyImport)) {
          content = content.replace(oldApiKeyImport, newApiKeyImport);
          updated = true;
        }
        
        // Update validateSimpleApiKey import
        const oldSimpleApiKeyImport = 'import { validateSimpleApiKey } from "@/lib/auth";';
        const newSimpleApiKeyImport = 'import { validateSimpleApiKey } from "@sass-store/config";';
        if (content.includes(oldSimpleApiKeyImport)) {
          content = content.replace(oldSimpleApiKeyImport, newSimpleApiKeyImport);
          updated = true;
        }
        
        if (updated) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated imports in: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
      }
    }
  }
}

// Run the update for the api directory
const apiDir = 'C:/Dev/Zo/sass-store/apps/api';
updateImportsInDirectory(apiDir);

console.log('Import updates completed.');