const { checkDatabaseConnection, getDatabaseDebugInfo } = require('./packages/database/connection');

async function testConnection() {
  console.log('=== DIAGNÓSTICO DE CONEXIÓN A SUPABASE ===\n');
  
  // Mostrar información de depuración
  const debugInfo = getDatabaseDebugInfo();
  console.log('Información de conexión:');
  console.log('- URL (mascarada):', debugInfo.maskedUrl);
  console.log('- ¿Es Supabase?:', debugInfo.isSupabase);
  console.log('- ¿Usa Pooler?:', debugInfo.isPooler);
  console.log('- SSL:', debugInfo.ssl);
  console.log('- Máximo de conexiones:', debugInfo.maxConnections);
  console.log('');
  
  // Probar conexión
  console.log('Probando conexión a la base de datos...');
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log('✅ Conexión exitosa a la base de datos');
    } else {
      console.log('❌ Falló la conexión a la base de datos');
    }
  } catch (error) {
    console.error('❌ Error al probar la conexión:', error.message);
    console.error('Detalles del error:', error);
  }
  
  console.log('\n=== FIN DEL DIAGNÓSTICO ===');
}

testConnection().catch(console.error);
