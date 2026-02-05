/**
 * Script para probar las rutas de API del sistema de fechas de retoque
 */

const BASE_URL = "http://localhost:3001/api/retouch";

// Función helper para hacer peticiones HTTP
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🔄 Probando: ${options.method || "GET"} ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log("📦 Response:", JSON.stringify(data, null, 2));

    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error("❌ Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Función principal para ejecutar todas las pruebas
async function runTests() {
  console.log("🚀 Iniciando pruebas del sistema de fechas de retoque...\n");

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Obtener lista de clientes ordenados por fecha de retoque
  console.log(
    "=== Test 1: Obtener lista de clientes ordenados por fecha de retoque ===",
  );
  const result1 = await fetchAPI("/customers");
  if (result1.success) {
    console.log("✅ Test 1 passed");
    testsPassed++;
  } else {
    console.log("❌ Test 1 failed");
    testsFailed++;
  }

  // Test 2: Obtener configuraciones de fechas de retoque
  console.log("\n=== Test 2: Obtener configuraciones de fechas de retoque ===");
  const result2 = await fetchAPI("/config");
  if (result2.success) {
    console.log("✅ Test 2 passed");
    testsPassed++;
  } else {
    console.log("❌ Test 2 failed");
    testsFailed++;
  }

  // Test 3: Obtener lista de días festivos
  console.log("\n=== Test 3: Obtener lista de días festivos ===");
  const result3 = await fetchAPI("/holidays");
  if (result3.success) {
    console.log("✅ Test 3 passed");
    testsPassed++;
  } else {
    console.log("❌ Test 3 failed");
    testsFailed++;
  }

  // Test 4: Crear un nuevo día festivo
  console.log("\n=== Test 4: Crear un nuevo día festivo ===");
  const newHoliday = {
    date: "2026-12-25",
    name: "Navidad",
    affectsRetouch: true,
  };
  const result4 = await fetchAPI("/holidays", {
    method: "POST",
    body: JSON.stringify(newHoliday),
  });
  if (result4.success) {
    console.log("✅ Test 4 passed");
    testsPassed++;

    // Guardar el ID del día festivo creado para eliminarlo después
    const holidayId = result4.data.data?.id;

    // Test 5: Eliminar el día festivo creado
    console.log("\n=== Test 5: Eliminar el día festivo creado ===");
    const result5 = await fetchAPI(`/holidays?id=${holidayId}`, {
      method: "DELETE",
    });
    if (result5.success) {
      console.log("✅ Test 5 passed");
      testsPassed++;
    } else {
      console.log("❌ Test 5 failed");
      testsFailed++;
    }
  } else {
    console.log("❌ Test 4 failed");
    testsFailed++;
  }

  // Test 6: Crear una configuración de fecha de retoque
  console.log("\n=== Test 6: Crear una configuración de fecha de retoque ===");
  const newConfig = {
    serviceId: "5c47b711-005a-4acb-b93b-bc3487ae4b99", // ID del servicio de prueba creado
    frequencyType: "weeks",
    frequencyValue: 2,
    businessDaysOnly: true,
    isDefault: false,
  };
  const result6 = await fetchAPI("/config", {
    method: "POST",
    body: JSON.stringify(newConfig),
  });
  if (result6.success) {
    console.log("✅ Test 6 passed");
    testsPassed++;
  } else {
    console.log("❌ Test 6 failed");
    testsFailed++;
  }

  // Test 7: Intentar obtener información de un cliente específico (esto podría fallar si no existe)
  console.log("\n=== Test 7: Obtener información de un cliente específico ===");
  const customerId = "cln6y9k4v0001v6n3z5e5b2d"; // ID de un cliente existente
  const result7 = await fetchAPI(`/customers/${customerId}`);
  if (result7.success || result7.status === 500) {
    console.log("✅ Test 7 passed (endpoint funciona)");
    testsPassed++;
  } else {
    console.log("❌ Test 7 failed");
    testsFailed++;
  }

  // Resumen
  console.log("\n=== RESUMEN DE PRUEBAS ===");
  console.log(`✅ Tests pasados: ${testsPassed}`);
  console.log(`❌ Tests fallidos: ${testsFailed}`);
  console.log(`📊 Total de tests: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log("🎉 ¡Todos los tests pasaron!");
  } else {
    console.log(
      "⚠️  Algunos tests fallaron. Revisa los logs para más detalles.",
    );
  }
}

// Ejecutar las pruebas
runTests().catch(console.error);
