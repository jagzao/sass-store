// Script para actualizar el rol de un usuario a Admin
const postgres = require('postgres');
const { randomUUID } = require('crypto');

// Configuración de la base de datos
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.jedryjmljffuvegggjmw:TSGmf_3G-rbLbz!@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

// Crear cliente de PostgreSQL
const sql = postgres(connectionString);

async function updateUserRole() {
  try {
    console.log('Actualizando rol de usuario a Admin...');
    
    // Buscar al usuario por email
    const user = await sql`
      SELECT * FROM users WHERE email = ${'testadmin@wondernails.com'}
    `;
    
    if (user.length === 0) {
      console.error('Usuario no encontrado');
      return;
    }
    
    console.log('Usuario encontrado:', user[0]);
    
    // Buscar el tenant por slug
    const tenant = await sql`
      SELECT * FROM tenants WHERE slug = ${'wondernails'}
    `;
    
    if (tenant.length === 0) {
      console.error('Tenant no encontrado');
      return;
    }
    
    console.log('Tenant encontrado:', tenant[0]);
    
    // Verificar si ya existe el rol del usuario
    const existingRole = await sql`
      SELECT * FROM user_roles 
      WHERE user_id = ${user[0].id} AND tenant_id = ${tenant[0].id}
    `;
    
    if (existingRole.length > 0) {
      // Actualizar el rol existente
      await sql`
        UPDATE user_roles 
        SET role = 'Admin' 
        WHERE user_id = ${user[0].id} AND tenant_id = ${tenant[0].id}
      `;
      console.log('Rol de usuario actualizado a Admin con éxito');
    } else {
      // Insertar un nuevo rol
      await sql`
        INSERT INTO user_roles (id, user_id, tenant_id, role, created_at, updated_at)
        VALUES (${randomUUID()}, ${user[0].id}, ${tenant[0].id}, 'Admin', NOW(), NOW())
      `;
      console.log('Rol de usuario creado como Admin con éxito');
    }
  } catch (error) {
    console.error('Error al actualizar el rol del usuario:', error);
  } finally {
    // Cerrar la conexión
    await sql.end();
  }
}

updateUserRole();