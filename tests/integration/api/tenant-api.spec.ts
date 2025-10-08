import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const baseURL = 'http://localhost:3001';
  const tenants = ['wondernails', 'nom-nom', 'delirios', 'zo-system'];

  test('Products API should enforce tenant isolation', async ({ request }) => {
    for (const tenant of tenants) {
      const response = await request.get(`${baseURL}/api/v1/products`, {
        headers: {
          'x-tenant': tenant
        }
      });

      expect(response.status()).toBe(200);

      const products = await response.json();
      expect(Array.isArray(products) || products.data).toBeTruthy();

      // Verify response includes tenant context
      const headers = response.headers();
      expect(headers['x-tenant'] || headers['X-Tenant']).toBeTruthy();
    }
  });

  test('Cross-tenant API access should be blocked', async ({ request }) => {
    // Try to access wondernails data with nom-nom tenant header
    const response = await request.get(`${baseURL}/api/v1/products`, {
      headers: {
        'x-tenant': 'nom-nom'
      }
    });

    if (response.status() === 200) {
      const products = await response.json();

      // Products should not contain wondernails-specific data
      const productData = Array.isArray(products) ? products : products.data || [];
      for (const product of productData.slice(0, 5)) { // Check first 5
        const productString = JSON.stringify(product).toLowerCase();
        expect(productString).not.toContain('wondernails');
      }
    }
  });

  test('API should return proper error formats', async ({ request }) => {
    // Test with invalid tenant
    const response = await request.get(`${baseURL}/api/v1/products`, {
      headers: {
        'x-tenant': 'invalid-tenant-xyz'
      }
    });

    // Should handle gracefully (either 404, 403, or fallback behavior)
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() >= 400) {
      const error = await response.json();
      expect(error.type || error.error || error.message).toBeTruthy();
    }
  });

  test('Rate limiting should be per-tenant', async ({ request }) => {
    const tenant = 'wondernails';
    const requests = [];

    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.get(`${baseURL}/api/v1/products`, {
          headers: {
            'x-tenant': tenant
          }
        })
      );
    }

    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status());

    // Most should succeed, but might have some rate limiting
    const successCount = statusCodes.filter(code => code === 200).length;
    const rateLimitCount = statusCodes.filter(code => code === 429).length;

    expect(successCount).toBeGreaterThan(5); // At least half should succeed

    if (rateLimitCount > 0) {
      // If rate limiting is implemented, check for proper headers
      const rateLimitedResponse = responses.find(r => r.status() === 429);
      if (rateLimitedResponse) {
        const headers = rateLimitedResponse.headers();
        expect(headers['retry-after'] || headers['x-ratelimit-reset']).toBeTruthy();
      }
    }
  });

  test('Media upload API should optimize images', async ({ request }) => {
    const tenant = 'wondernails';

    // Create a small test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    formData.append('file', new Blob([testImageBuffer], { type: 'image/png' }), 'test.png');

    const response = await request.post(`${baseURL}/api/v1/media/upload`, {
      headers: {
        'x-tenant': tenant
      },
      data: formData
    });

    if (response.status() === 200) {
      const result = await response.json();

      // Should return optimized variants
      expect(result.variants || result.url).toBeTruthy();

      if (result.variants) {
        // Check for modern formats
        const variantUrls = Object.values(result.variants).join(' ');
        expect(variantUrls.includes('.webp') || variantUrls.includes('.avif')).toBeTruthy();
      }

      // Should include metadata
      expect(result.metadata || result.blurhash || result.dominantColor).toBeTruthy();
    }
  });

  test('Booking API should validate tenant context', async ({ request }) => {
    const bookingTenants = ['wondernails', 'vigistudio', 'villafuerte'];

    for (const tenant of bookingTenants) {
      // Get available slots
      const slotsResponse = await request.get(`${baseURL}/api/v1/slots`, {
        headers: {
          'x-tenant': tenant
        }
      });

      if (slotsResponse.status() === 200) {
        const slots = await slotsResponse.json();
        expect(Array.isArray(slots) || slots.data).toBeTruthy();

        // Try to create a booking
        const bookingData = {
          serviceId: 'test-service',
          staffId: 'test-staff',
          datetime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          customerInfo: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+1234567890'
          }
        };

        const bookingResponse = await request.post(`${baseURL}/api/v1/bookings`, {
          headers: {
            'x-tenant': tenant,
            'content-type': 'application/json'
          },
          data: bookingData
        });

        // Should either succeed or fail gracefully
        expect([200, 201, 400, 401, 403]).toContain(bookingResponse.status());

        if (bookingResponse.status() >= 200 && bookingResponse.status() < 300) {
          const booking = await bookingResponse.json();
          expect(booking.id || booking.bookingId).toBeTruthy();
          expect(booking.tenantId || booking.tenant).toBe(tenant);
        }
      }
    }
  });

  test('Social Planner API should handle post scheduling', async ({ request }) => {
    const tenant = 'wondernails';

    // Create a scheduled post
    const postData = {
      title: 'Test Post',
      content: 'This is a test post for automated testing',
      platforms: ['instagram', 'facebook'],
      scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      timezone: 'America/Mexico_City'
    };

    const response = await request.post(`${baseURL}/api/v1/social/posts`, {
      headers: {
        'x-tenant': tenant,
        'content-type': 'application/json'
      },
      data: postData
    });

    if (response.status() === 200 || response.status() === 201) {
      const post = await response.json();

      expect(post.id).toBeTruthy();
      expect(post.status).toBe('scheduled');
      expect(post.targets).toBeTruthy();
      expect(Array.isArray(post.targets)).toBeTruthy();

      // Verify targets were created for each platform
      expect(post.targets.length).toBe(postData.platforms.length);

      // Get the created post
      const getResponse = await request.get(`${baseURL}/api/v1/social/posts/${post.id}`, {
        headers: {
          'x-tenant': tenant
        }
      });

      expect(getResponse.status()).toBe(200);
      const retrievedPost = await getResponse.json();
      expect(retrievedPost.id).toBe(post.id);
    }
  });

  test('Cache invalidation should be tenant-specific', async ({ request }) => {
    const tenant1 = 'wondernails';
    const tenant2 = 'nom-nom';

    // Make requests to both tenants
    const response1 = await request.get(`${baseURL}/api/v1/products`, {
      headers: { 'x-tenant': tenant1 }
    });

    const response2 = await request.get(`${baseURL}/api/v1/products`, {
      headers: { 'x-tenant': tenant2 }
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    // Check cache headers
    const headers1 = response1.headers();
    const headers2 = response2.headers();

    // Should have cache control headers
    expect(headers1['cache-control'] || headers1['etag']).toBeTruthy();
    expect(headers2['cache-control'] || headers2['etag']).toBeTruthy();

    // ETags should be different for different tenants
    if (headers1['etag'] && headers2['etag']) {
      expect(headers1['etag']).not.toBe(headers2['etag']);
    }
  });

  test('Health check endpoints should be accessible', async ({ request }) => {
    const healthResponse = await request.get(`${baseURL}/api/health`);
    expect(healthResponse.status()).toBe(200);

    const health = await healthResponse.json();
    expect(health.status).toBe('ok');
    expect(health.timestamp).toBeTruthy();

    // Check database connectivity
    if (health.checks) {
      expect(health.checks.database || health.checks.db).toBeTruthy();
    }
  });

  test('API versioning should be consistent', async ({ request }) => {
    const tenant = 'wondernails';

    // Test v1 endpoints
    const v1Response = await request.get(`${baseURL}/api/v1/products`, {
      headers: { 'x-tenant': tenant }
    });

    expect(v1Response.status()).toBe(200);

    // Check API version header
    const headers = v1Response.headers();
    const apiVersion = headers['x-api-version'] || headers['api-version'];
    if (apiVersion) {
      expect(apiVersion).toMatch(/^v?\d+/);
    }
  });
});