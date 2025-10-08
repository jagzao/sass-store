#!/bin/bash
# Script to fix WCAG AA color contrast issues
# Replaces light gray colors with darker, accessible alternatives

echo "🎨 Corrigiendo problemas de contraste de color para WCAG AA..."
echo ""

# Find all TSX files with light gray colors
FILES=$(grep -r "text-gray-300\|text-gray-400" apps/web --include="*.tsx" -l)

for file in $FILES; do
  echo "📝 Procesando: $file"

  # Replace text-gray-300 with text-gray-600 (except in dark backgrounds)
  # Replace text-gray-400 with text-gray-600

  # For light backgrounds
  sed -i 's/text-gray-300\([^"]*"\)/text-gray-600\1/g' "$file"
  sed -i 's/text-gray-400\([^"]*"\)/text-gray-600\1/g' "$file"
done

echo ""
echo "✅ Correcciones completadas!"
echo ""
echo "Archivos modificados:"
echo "$FILES" | wc -l
echo ""
echo "Verifica los cambios y ejecuta los tests:"
echo "  npm run test:e2e:all"
