const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Crear directorio de backups si no existe
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Configurar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para realizar el backup
async function performBackup() {
  try {
    console.log('Iniciando backup de la base de datos...');
    
    // Obtener timestamp actual
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    
    // Inicializar el contenido del backup
    let backupContent = `-- Backup de Supabase - ${timestamp}
-- Proyecto: ${process.env.SUPABASE_PROJECT_ID || 'sass-store'}

-- Este archivo contiene un backup de la base de datos
-- Fecha de creación: ${new Date().toISOString()}

`;

    // Función auxiliar para obtener datos de una tabla
    const getTableData = async (tableName) => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
          
        if (error) {
          console.error(`Error al obtener datos de la tabla ${tableName}:`, error);
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error(`Error inesperado al obtener datos de la tabla ${tableName}:`, err);
        return [];
      }
    };

    // Función para generar sentencias INSERT a partir de datos
    const generateInserts = (tableName, data) => {
      if (!data || data.length === 0) return '';
      
      const columns = Object.keys(data[0]);
      const columnNames = columns.map(col => `"${col}"`).join(', ');
      
      const insertStatements = data.map(row => {
        const values = columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) {
            return 'NULL';
          } else if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
          } else if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
          } else if (value instanceof Date) {
            return `'${value.toISOString()}'`;
          } else {
            return value;
          }
        }).join(', ');
        
        return `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});`;
      });
      
      return insertStatements.join('\n') + '\n';
    };

    // Tablas a respaldar
    // Tablas a respaldar
    const tablesToBackup = [
      'tenants',
      'tenant_configs',
      'api_keys',
      'products',
      'services',
      'staff',
      'bookings',
      'media_assets',
      'tenant_quotas',
      'orders',
      'order_items',
      'payments',
      'audit_logs',
      'tenant_channels',
      'channel_accounts',
      'channel_credentials',
      'social_posts',
      'social_post_targets',
      'content_variants',
      'posting_rules',
      'post_jobs',
      'post_results',
      'media_renditions',
      'customers',
      'customer_visits',
      'visit_photos',
      'customer_visit_services',
      'menu_designs',
      'users',
      'accounts',
      'sessions',
      'verification_tokens',
      'user_roles',
      'product_reviews',
      'financial_kpis',
      'financial_movements',
      'user_carts',
      'campaigns',
      'reels',
      'pos_terminals',
      'mercadopago_tokens',
      'mercadopago_payments',
      'oauth_state_tokens',
      'customer_advances',
      'advance_applications'
    ];

    // Generar backup para cada tabla
    for (const tableName of tablesToBackup) {
      console.log(`Procesando tabla: ${tableName}`);
      
      // Agregar comentario de la tabla
      backupContent += `\n\n-- Datos de la tabla: ${tableName}\n`;
      
      // Obtener datos de la tabla
      const tableData = await getTableData(tableName);
      
      if (tableData.length > 0) {
        // Generar sentencias INSERT
        backupContent += generateInserts(tableName, tableData);
      } else {
        backupContent += `-- La tabla ${tableName} no contiene datos\n`;
      }
    }

    // Escribir backup a archivo
    fs.writeFileSync(backupFile, backupContent);
    console.log(`Backup completado: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('Error durante el backup:', error);
    process.exit(1);
  }
}

// Ejecutar backup
performBackup().then(() => {
  console.log('Proceso de backup finalizado correctamente');
  process.exit(0);
}).catch(error => {
  console.error('Error en el proceso de backup:', error);
  process.exit(1);
});