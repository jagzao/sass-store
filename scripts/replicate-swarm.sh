#!/bin/bash
# Script para replicar el AI Swarm System a otro proyecto

set -e

echo "🚀 AI Swarm System - Replication Script"
echo "========================================"
echo ""

# Verificar argumentos
if [ -z "$1" ]; then
    echo "❌ Error: Debes proporcionar la ruta del proyecto destino"
    echo ""
    echo "Uso: ./scripts/replicate-swarm.sh /ruta/a/tu/proyecto"
    echo ""
    echo "Ejemplo:"
    echo "  ./scripts/replicate-swarm.sh ~/projects/mi-nuevo-proyecto"
    exit 1
fi

TARGET_DIR="$1"

# Verificar que el directorio existe
if [ ! -d "$TARGET_DIR" ]; then
    echo "❌ Error: El directorio $TARGET_DIR no existe"
    exit 1
fi

echo "📁 Directorio destino: $TARGET_DIR"
echo ""

# Crear estructura de directorios
echo "📂 Creando estructura de directorios..."
mkdir -p "$TARGET_DIR/agents/swarm/agents"
mkdir -p "$TARGET_DIR/agents/swarm/cli"
mkdir -p "$TARGET_DIR/agents/swarm/sessions"
mkdir -p "$TARGET_DIR/docs"
mkdir -p "$TARGET_DIR/docs/prd"

# Copiar archivos del sistema swarm
echo "📦 Copiando archivos del sistema swarm..."

# Base Agent y tipos
cp agents/swarm/agents/base-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/types.ts "$TARGET_DIR/agents/swarm/"

# Agentes especializados
cp agents/swarm/agents/architect-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/agents/developer-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/agents/qa-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/agents/code-quality-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/agents/security-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/agents/tester-agent.ts "$TARGET_DIR/agents/swarm/agents/"
cp agents/swarm/agents/pm-agent.ts "$TARGET_DIR/agents/swarm/agents/"

# CLI
cp agents/swarm/cli/start.ts "$TARGET_DIR/agents/swarm/cli/"
cp agents/swarm/cli/status.ts "$TARGET_DIR/agents/swarm/cli/"
cp agents/swarm/cli/resume.ts "$TARGET_DIR/agents/swarm/cli/"
cp agents/swarm/cli/continue.ts "$TARGET_DIR/agents/swarm/cli/"
cp agents/swarm/cli/ui.ts "$TARGET_DIR/agents/swarm/cli/"

# Configuración
cp agents/swarm/agents-config.ts "$TARGET_DIR/agents/swarm/"
cp agents/swarm/swarm-manager.ts "$TARGET_DIR/agents/swarm/"

# Documentación
cp AGENTS.md "$TARGET_DIR/"
cp docs/SWARM_REPLICATION_GUIDE.md "$TARGET_DIR/docs/"

echo "✅ Archivos copiados exitosamente"
echo ""

# Agregar scripts a package.json
echo "📝 Agregando scripts a package.json..."

if [ -f "$TARGET_DIR/package.json" ]; then
    # Crear backup
    cp "$TARGET_DIR/package.json" "$TARGET_DIR/package.json.backup"

    # Usar Node para agregar scripts
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$TARGET_DIR/package.json', 'utf8'));

if (!pkg.scripts) pkg.scripts = {};

pkg.scripts['swarm:start'] = 'ts-node --transpile-only ./agents/swarm/cli/start.ts';
pkg.scripts['swarm:status'] = 'ts-node --transpile-only ./agents/swarm/cli/status.ts';
pkg.scripts['swarm:resume'] = 'ts-node --transpile-only ./agents/swarm/cli/resume.ts';
pkg.scripts['swarm:continue'] = 'ts-node --transpile-only ./agents/swarm/cli/continue.ts';

fs.writeFileSync('$TARGET_DIR/package.json', JSON.stringify(pkg, null, 2));
"

    echo "✅ Scripts agregados a package.json"
    echo "   (Backup guardado en package.json.backup)"
else
    echo "⚠️  No se encontró package.json en el proyecto destino"
    echo "   Deberás agregar los scripts manualmente"
fi

echo ""
echo "🎉 ¡Replicación completada!"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Navega al proyecto:"
echo "   cd $TARGET_DIR"
echo ""
echo "2. Instala dependencias (si no están instaladas):"
echo "   npm install typescript ts-node @types/node --save-dev"
echo ""
echo "3. Personaliza AGENTS.md con tus estándares:"
echo "   nano AGENTS.md"
echo ""
echo "4. Ajusta agents-config.ts a tu estructura:"
echo "   nano agents/swarm/agents-config.ts"
echo ""
echo "5. Prueba el swarm:"
echo "   npm run swarm:start \"Test feature\""
echo ""
echo "📚 Para más información, lee:"
echo "   docs/SWARM_REPLICATION_GUIDE.md"
echo ""
echo "✨ ¡Feliz desarrollo con AI Swarm!"
