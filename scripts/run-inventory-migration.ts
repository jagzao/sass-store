/**
 * Script para ejecutar la migración de inventario
 */

import "dotenv/config";
import { db } from "../packages/database/connection";
import { sql } from "drizzle-orm";

async function runInventoryMigration() {
  console.log("🔄 Iniciando migración de inventario...");

  try {
    // Leer el archivo SQL
    const fs = require("fs");
    const path = require("path");
    const sqlFile = fs.readFileSync(
      path.join(__dirname, "inventory-migration.sql"),
      "utf8",
    );

    // Dividir el SQL en sentencias individuales (ignorando comentarios y líneas vacías)
    const statements = sqlFile
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Ejecutando ${statements.length} sentencias SQL...`);

    // Vamos a ejecutar primero las sentencias CREATE TABLE
    console.log("📋 Creando tablas...");
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      // Solo ejecutar sentencias CREATE TABLE primero
      if (statement.includes("CREATE TABLE")) {
        try {
          await db.execute(sql.raw(statement));
          console.log(
            `✅ Tabla creada: ${statement.split("CREATE TABLE")[1].split(" ")[1].trim()}`,
          );
        } catch (error) {
          console.error(`❌ Error creando tabla:`, error.message);
          console.error("Sentencia:", statement.substring(0, 100) + "...");
        }
      }
    }

    // Luego ejecutar los índices
    console.log("📋 Creando índices...");
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      if (statement.includes("CREATE INDEX")) {
        try {
          await db.execute(sql.raw(statement));
          console.log(
            `✅ Índice creado: ${statement.split("CREATE INDEX")[1].split(" ")[1].trim()}`,
          );
        } catch (error) {
          // Ignorar errores de índices ya existentes
          if (!error.message.includes("already exists")) {
            console.error(`❌ Error creando índice:`, error.message);
          }
        }
      }
    }

    // Luego ejecutar las funciones
    console.log("📋 Creando funciones...");
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      if (statement.includes("CREATE OR REPLACE FUNCTION")) {
        try {
          await db.execute(sql.raw(statement));
          console.log(`✅ Función creada`);
        } catch (error) {
          console.error(`❌ Error creando función:`, error.message);
        }
      }
    }

    // Luego ejecutar los triggers
    console.log("📋 Creando triggers...");
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      if (statement.includes("CREATE TRIGGER")) {
        try {
          await db.execute(sql.raw(statement));
          console.log(
            `✅ Trigger creado: ${statement.split("CREATE TRIGGER")[1].split(" ")[1].trim()}`,
          );
        } catch (error) {
          console.error(`❌ Error creando trigger:`, error.message);
        }
      }
    }

    // Finalmente ejecutar el resto (RLS, comentarios, etc.)
    console.log("📋 Aplicando configuración final...");
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ";";

      if (
        !statement.includes("CREATE TABLE") &&
        !statement.includes("CREATE INDEX") &&
        !statement.includes("CREATE OR REPLACE FUNCTION") &&
        !statement.includes("CREATE TRIGGER")
      ) {
        try {
          await db.execute(sql.raw(statement));
          console.log(`✅ Configuración aplicada`);
        } catch (error) {
          // Ignorar errores de configuración ya existente
          if (
            !error.message.includes("already exists") &&
            !error.message.includes("no transaction in progress")
          ) {
            console.error(`❌ Error en configuración:`, error.message);
          }
        }
      }
    }

    console.log("🎉 Migración de inventario completada exitosamente!");
  } catch (error) {
    console.error("❌ Error fatal en la migración:", error);
    process.exit(1);
  }
}

runInventoryMigration()
  .then(() => {
    console.log("✅ Proceso de migración finalizado.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
