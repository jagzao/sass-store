const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixCampaignsTenantFK() {
  const client = await pool.connect();
  
  try {
    console.log('Iniciando corrección de la restricción de clave externa en campaigns...');
    
    // Primero, vamos a identificar los registros problemáticos
    const problematicRecordsQuery = `
      SELECT c.id, c.tenant_id, t.id as tenant_exists
      FROM campaigns c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      WHERE t.id IS NULL
    `;
    
    const result = await client.query(problematicRecordsQuery);
    console.log(`Se encontraron ${result.rows.length} registros problemáticos en campaigns:`);
    
    if (result.rows.length > 0) {
      console.log('Registros problemáticos:');
      result.rows.forEach(row => {
        console.log(`  - Campaign ID: ${row.id}, Tenant ID: ${row.tenant_id}`);
      });
      
      // Eliminar los registros problemáticos
      const deleteQuery = `
        DELETE FROM campaigns
        WHERE tenant_id NOT IN (SELECT id FROM tenants)
      `;
      
      const deleteResult = await client.query(deleteQuery);
      console.log(`Se eliminaron ${deleteResult.rowCount} registros problemáticos de campaigns.`);
    } else {
      console.log('No se encontraron registros problemáticos en campaigns.');
    }
    
    // Verificar si hay otras tablas con problemas similares
    const tablesWithFK = [
      'customer_visits',
      'reels',
      'customer_visit_services',
      'channel_accounts',
      'content_variants',
      'channel_credentials',
      'tenant_channels',
      'posting_rules',
      'post_jobs',
      'post_results',
      'media_renditions',
      'mercadopago_payments',
      'pos_terminals',
      'financial_movements',
      'mercadopago_tokens',
      'financial_kpis',
      'customers',
      'tenant_configs'
    ];
    
    for (const table of tablesWithFK) {
      const problematicRecordsQuery = `
        SELECT COUNT(*) as count
        FROM ${table}
        WHERE tenant_id NOT IN (SELECT id FROM tenants)
      `;
      
      try {
        const result = await client.query(problematicRecordsQuery);
        if (parseInt(result.rows[0].count) > 0) {
          console.log(`Se encontraron ${result.rows[0].count} registros problemáticos en ${table}.`);
          
          // Eliminar los registros problemáticos
          const deleteQuery = `
            DELETE FROM ${table}
            WHERE tenant_id NOT IN (SELECT id FROM tenants)
          `;
          
          const deleteResult = await client.query(deleteQuery);
          console.log(`Se eliminaron ${deleteResult.rowCount} registros problemáticos de ${table}.`);
        }
      } catch (error) {
        console.log(`Error al verificar ${table}: ${error.message}`);
      }
    }
    
    console.log('Corrección completada con éxito.');
  } catch (error) {
    console.error('Error al corregir la restricción de clave externa:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la función
fixCampaignsTenantFK();