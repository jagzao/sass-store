#!/bin/bash

echo "============================================"
echo "🔧 Solucionando ERR_CONNECTION_REFUSED..."
echo "============================================"
echo ""

echo "1️⃣ Paso 1: Deteniendo procesos Node.js..."
pkill -9 node 2>/dev/null || echo "No hay procesos Node.js corriendo"
echo "✅ Procesos detenidos"
echo ""

echo "2️⃣ Paso 2: Eliminando node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' + 2>/dev/null
echo "✅ node_modules eliminados"
echo ""

echo "3️⃣ Paso 3: Limpiando cache de npm..."
npm cache clean --force
echo "✅ Cache de npm limpiado"
echo ""

echo "4️⃣ Paso 4: Eliminando cache de Next.js y Turbo..."
find . -name ".next" -type d -prune -exec rm -rf '{}' + 2>/dev/null
find . -name ".turbo" -type d -prune -exec rm -rf '{}' + 2>/dev/null
rm -rf .turbo node_modules/.cache package-lock.json 2>/dev/null
echo "✅ Cache de Next.js y Turbo eliminado"
echo ""

echo "5️⃣ Paso 5: Reinstalando dependencias (esto puede tomar 2-5 minutos)..."
npm install --force
if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi
echo "✅ Dependencias reinstaladas"
echo ""

echo "6️⃣ Paso 6: Verificando turbo.json..."
if grep -q '"tasks":' turbo.json; then
    echo "⚠️  ADVERTENCIA: turbo.json usa \"tasks\" en lugar de \"pipeline\""
    echo "   Para Turbo v1.x debe usar \"pipeline\""
    echo "   Corrigiendo automáticamente..."
    sed -i 's/"tasks":/"pipeline":/g' turbo.json
    echo "✅ turbo.json corregido"
else
    echo "✅ turbo.json verificado"
fi
echo ""

echo "============================================"
echo "✅ Limpieza completada exitosamente"
echo "============================================"
echo ""
echo "Ejecutando npm run dev..."
echo ""
npm run dev
