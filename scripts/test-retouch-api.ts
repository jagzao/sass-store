// We'll import the service directly in this test script
// The actual import will be done after setting up the environment

async function testRetouchAPI() {
  console.log("Testing Retouch API...");

  // Test tenant ID - replace with actual tenant ID
  const tenantId = "your-tenant-id-here";

  try {
    // Test 1: Get customers by retouch date
    console.log("\n1. Testing getCustomersByRetouchDate...");
    const customersResult = await RetouchService.getCustomersByRetouchDate(
      tenantId,
      10,
      0,
    );

    if (customersResult.success) {
      console.log(
        "✅ Success: Retrieved",
        customersResult.data.length,
        "customers",
      );
      if (customersResult.data.length > 0) {
        console.log("Sample customer:", customersResult.data[0]);
      }
    } else {
      console.log("❌ Error:", customersResult.error);
    }

    // Test 2: Get service retouch configs
    console.log("\n2. Testing getServiceRetouchConfigs...");
    const configsResult =
      await RetouchService.getServiceRetouchConfigs(tenantId);

    if (configsResult.success) {
      console.log(
        "✅ Success: Retrieved",
        configsResult.data.length,
        "configs",
      );
      if (configsResult.data.length > 0) {
        console.log("Sample config:", configsResult.data[0]);
      }
    } else {
      console.log("❌ Error:", configsResult.error);
    }

    // Test 3: Create a retouch config
    console.log("\n3. Testing upsertServiceRetouchConfig...");
    const serviceId = "your-service-id-here"; // Replace with actual service ID

    const createConfigResult = await RetouchService.upsertServiceRetouchConfig(
      tenantId,
      serviceId,
      "days",
      15,
      true,
      false,
    );

    if (createConfigResult.success) {
      console.log("✅ Success: Created/updated retouch config");
    } else {
      console.log("❌ Error:", createConfigResult.error);
    }

    // Test 4: Calculate next retouch date
    console.log("\n4. Testing calculateNextRetouchDate...");
    const customerId = "your-customer-id-here"; // Replace with actual customer ID

    const calculateResult = await RetouchService.calculateNextRetouchDate(
      tenantId,
      customerId,
      serviceId,
    );

    if (calculateResult.success) {
      console.log(
        "✅ Success: Next retouch date is",
        calculateResult.data.toISOString(),
      );
    } else {
      console.log("❌ Error:", calculateResult.error);
    }

    // Test 5: Update customer retouch date
    console.log("\n5. Testing updateCustomerRetouchDate...");
    const updateResult = await RetouchService.updateCustomerRetouchDate(
      tenantId,
      customerId,
      serviceId,
    );

    if (updateResult.success) {
      console.log(
        "✅ Success: Updated retouch date to",
        updateResult.data.toISOString(),
      );
    } else {
      console.log("❌ Error:", updateResult.error);
    }

    console.log("\nRetouch API testing completed!");
  } catch (error) {
    console.error("Unexpected error during testing:", error);
  }
}

// Run the tests
testRetouchAPI();
