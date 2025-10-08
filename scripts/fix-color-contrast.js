const fs = require('fs');
const path = require('path');

/**
 * Script to fix WCAG AA color contrast issues
 * Replaces light gray colors with darker accessible alternatives
 */

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixColorContrast() {
  console.log('🎨 Corrigiendo problemas de contraste de color para WCAG AA...\n');

  const webDir = path.join(__dirname, '..', 'apps', 'web');
  const files = getAllFiles(webDir);

  let modifiedCount = 0;
  let totalReplacements = 0;

  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;

      // Replace text-gray-300 with text-gray-600 (more accessible)
      content = content.replace(/text-gray-300(?!\d)/g, 'text-gray-600');

      // Replace text-gray-400 with text-gray-600 (more accessible)
      content = content.replace(/text-gray-400(?!\d)/g, 'text-gray-600');

      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;

        // Count replacements
        const matches300 = (originalContent.match(/text-gray-300(?!\d)/g) || []).length;
        const matches400 = (originalContent.match(/text-gray-400(?!\d)/g) || []).length;
        const total = matches300 + matches400;

        totalReplacements += total;
        console.log(`✅ ${path.relative(process.cwd(), file)}`);
        console.log(`   - Reemplazos: ${total} (gray-300: ${matches300}, gray-400: ${matches400})\n`);
      }
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message);
    }
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ CORRECCIÓN COMPLETADA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`📝 Archivos modificados: ${modifiedCount}`);
  console.log(`🔄 Reemplazos totales: ${totalReplacements}`);
  console.log('\n✅ text-gray-300 → text-gray-600');
  console.log('✅ text-gray-400 → text-gray-600');
  console.log('\n🎯 Resultado: WCAG AA color contrast mejorado\n');
  console.log('Ejecuta los tests para verificar:');
  console.log('  npm run test:e2e:all\n');
}

fixColorContrast();
