const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para mostrar ayuda
function showHelp() {
  console.log(`
Uso: node restore-database.js [opciones]

Opciones:
  -h, --help        Muestra esta ayuda
  -f, --file        Ruta al archivo de backup a restaurar
  --drop-tables     Elimina las tablas existentes antes de restaurar (CUIDADO)
  --confirm         Omite la confirmación interactiva

Ejemplos:
  node restore-database.js -f ./backups/backup-2023-01-01T12-00-00Z.sql
  node restore-database.js -f ./backups/backup-2023-01-01T12-00-00Z.sql --drop-tables --confirm
`);
}

// Función para parsear argumentos de línea de comandos
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    dropTables: false,
    confirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
        break;
      case '-f':
      case '--file':
        options.file = args[++i];
        break;
      case '--drop-tables':
        options.dropTables = true;
        break;
      case '--confirm':
        options.confirm = true;
        break;
      default:
        console.error(`Opción desconocida: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }

  if (!options.file) {
    console.error('Error: Se requiere especificar un archivo de backup con -f o --file');
    showHelp();
    process.exit(1);
  }

  return options;
}

// Función para confirmar acción
async function confirmAction(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (s/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'y');
    });
  });
}

// Función para ejecutar sentencias SQL
async function executeSQL(sql) {
  try {
    // Dividir el SQL en sentencias individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim().toUpperCase().startsWith('INSERT')) {
        // Extraer nombre de la tabla del INSERT
        const tableMatch = statement.match(/INSERT INTO "([^"]+)"/);
        if (tableMatch) {
          const tableName = tableMatch[1];
          
          // Extraer valores del INSERT
          const valuesMatch = statement.match(/\((.*)\)/);
          if (valuesMatch) {
            const columns = statement.match(/INSERT INTO "[^"]+" \(([^)]+)\)/)[1]
              .split(',')
              .map(col => col.trim().replace(/"/g, ''));
            
            const valuesPart = statement.match(/VALUES \((.*)\)/)[1];
            const values = valuesPart.split(',').map(v => {
              v = v.trim();
              if (v === 'NULL') return null;
              if (v.startsWith("'") && v.endsWith("'")) {
                return v.slice(1, -1).replace(/''/g, "'");
              }
              if (v === 'TRUE') return true;
              if (v === 'FALSE') return false;
              if (!isNaN(v)) return Number(v);
              return v;
            });
            
            // Crear objeto para insertar
            const insertObj = {};
            columns.forEach((col, i) => {
              insertObj[col] = values[i];
            });
            
            // Ejecutar inserción
            const { error } = await supabase
              .from(tableName)
              .insert([insertObj]);
            
            if (error) {
              console.error(`Error al insertar en la tabla ${tableName}:`, error);
              throw error;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al ejecutar SQL:', error);
    throw error;
  }
}

// Función para eliminar tablas existentes
async function dropTables() {
  try {
    console.log('Eliminando tablas existentes...');
    
    const tables = [
      'bookings',
      'payments',
      'user_roles',
      'services',
      'products',
      'users',
      'tenants'
    ];

    for (const table of tables) {
      console.log(`Eliminando tabla: ${table}`);
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 'dummy-value-to-delete-all'); // Esto eliminará todos los registros
      
      if (error) {
        console.error(`Error al eliminar la tabla ${table}:`, error);
        throw error;
      }
    }
    
    console.log('Tablas eliminadas exitosamente');
  } catch (error) {
    console.error('Error al eliminar tablas:', error);
    throw error;
  }
}

// Función principal de restauración
async function restoreDatabase(options) {
  try {
    console.log('Iniciando restauración de la base de datos...');
    
    // Verificar que el archivo existe
    if (!fs.existsSync(options.file)) {
      console.error(`Error: El archivo ${options.file} no existe`);
      process.exit(1);
    }
    
    // Leer archivo de backup
    const backupContent = fs.readFileSync(options.file, 'utf8');
    
    // Confirmar restauración
    if (!options.confirm) {
      const confirmed = await confirmAction(
        `¿Estás seguro que deseas restaurar la base de datos usando el archivo ${options.file}?`
      );
      
      if (!confirmed) {
        console.log('Restauración cancelada');
        process.exit(0);
      }
      
      if (options.dropTables) {
        const dropConfirmed = await confirmAction(
          '¿Estás seguro que deseas eliminar todas las tablas existentes? ESTA ACCIÓN ES IRREVERSIBLE.'
        );
        
        if (!dropConfirmed) {
          console.log('Restauración cancelada');
          process.exit(0);
        }
      }
    }
    
    // Eliminar tablas si se solicita
    if (options.dropTables) {
      await dropTables();
    }
    
    // Ejecutar restauración
    console.log('Restaurando datos...');
    await executeSQL(backupContent);
    
    console.log('Restauración completada exitosamente');
  } catch (error) {
    console.error('Error durante la restauración:', error);
    process.exit(1);
  }
}

// Ejecutar restauración
async function main() {
  const options = parseArgs();
  await restoreDatabase(options);
}

main().then(() => {
  console.log('Proceso de restauración finalizado correctamente');
  process.exit(0);
}).catch(error => {
  console.error('Error en el proceso de restauración:', error);
  process.exit(1);
});