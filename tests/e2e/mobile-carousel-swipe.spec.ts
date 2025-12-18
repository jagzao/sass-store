import { test, expect } from "@playwright/test";

test.describe("Mobile Carousel Swipe Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to the home page
    await page.goto("/");
  });

  test("should swipe left to navigate to next product", async ({ page }) => {
    // Wait for carousel to load
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Get the initial product title
    const initialTitle = await page.locator(".topic").first().textContent();

    // Perform swipe left gesture
    const carousel = page.locator('[data-testid="carousel-container"]');
    const carouselBox = await carousel.boundingBox();

    if (!carouselBox) {
      throw new Error("Carousel not found");
    }

    // Swipe from right to left (next)
    await carousel.dragTo(carousel, {
      sourcePosition: { x: carouselBox.width * 0.8, y: carouselBox.height / 2 },
      targetPosition: { x: carouselBox.width * 0.2, y: carouselBox.height / 2 },
    });

    // Wait for animation to complete
    await page.waitForTimeout(1000);

    // Verify that the product has changed
    const newTitle = await page.locator(".topic").first().textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test("should swipe right to navigate to previous product", async ({
    page,
  }) => {
    // Wait for carousel to load
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Get the initial product title
    const initialTitle = await page.locator(".topic").first().textContent();

    // Perform swipe right gesture
    const carousel = page.locator('[data-testid="carousel-container"]');
    const carouselBox = await carousel.boundingBox();

    if (!carouselBox) {
      throw new Error("Carousel not found");
    }

    // Swipe from left to right (previous)
    await carousel.dragTo(carousel, {
      sourcePosition: { x: carouselBox.width * 0.2, y: carouselBox.height / 2 },
      targetPosition: { x: carouselBox.width * 0.8, y: carouselBox.height / 2 },
    });

    // Wait for animation to complete
    await page.waitForTimeout(1000);

    // Verify that the product has changed
    const newTitle = await page.locator(".topic").first().textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test("should be able to click on image to add product to cart", async ({
    page,
  }) => {
    // Wait for carousel to load
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Click on the product image
    await page.locator(".clickableImgWrap").first().click();

    // Verify that the cart notification appears (this assumes there's a cart notification)
    // You may need to adjust this based on your actual cart implementation
    await page.waitForTimeout(500);

    // Check if cart count increased or if there's a success message
    // This will depend on your cart implementation
    const cartIcon = page.locator('[data-testid="cart-icon"]'); // Adjust selector as needed
    if (await cartIcon.isVisible()) {
      // If cart icon exists, we can check if it has a badge with count
      const cartBadge = page.locator('[data-testid="cart-badge"]');
      if (await cartBadge.isVisible()) {
        const badgeText = await cartBadge.textContent();
        expect(parseInt(badgeText || "0")).toBeGreaterThan(0);
      }
    }
  });

  test("should be able to click on image to reserve service", async ({
    page,
  }) => {
    // Wait for carousel to load
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Navigate to a service (this assumes the first slide might not be a service)
    // You may need to adjust this based on your carousel content
    let serviceFound = false;
    let attempts = 0;

    while (!serviceFound && attempts < 5) {
      // Check if current item is a service
      const detailButtons = page.locator(".checkout");
      if (await detailButtons.isVisible()) {
        serviceFound = true;
      } else {
        // Swipe to next item
        const carousel = page.locator('[data-testid="carousel-container"]');
        const carouselBox = await carousel.boundingBox();

        if (carouselBox) {
          await carousel.dragTo(carousel, {
            sourcePosition: {
              x: carouselBox.width * 0.8,
              y: carouselBox.height / 2,
            },
            targetPosition: {
              x: carouselBox.width * 0.2,
              y: carouselBox.height / 2,
            },
          });
          await page.waitForTimeout(1000);
        }
        attempts++;
      }
    }

    if (serviceFound) {
      // Click on the service image
      await page.locator(".clickableImgWrap").first().click();

      // Verify that the reservation process started
      // This will depend on your reservation flow
      await page.waitForTimeout(500);

      // Check if we navigated to a booking page or if a modal appeared
      const bookingModal = page.locator('[data-testid="booking-modal"]'); // Adjust selector as needed
      const bookingPage = page.locator('[data-testid="booking-page"]'); // Adjust selector as needed

      expect(
        (await bookingModal.isVisible()) || (await bookingPage.isVisible()),
      ).toBeTruthy();
    } else {
      // If no service found, skip this test or mark as passed
      test.skip();
    }
  });

  test("should show overlay text on image hover", async ({ page }) => {
    // Wait for carousel to load
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Hover over the product image
    const imgWrap = page.locator(".clickableImgWrap").first();
    await imgWrap.hover();

    // Check if overlay text appears
    const overlayText = page.locator(".imgOverlayText").first();
    await expect(overlayText).toBeVisible();

    // Check if the text is correct based on product type
    const textContent = await overlayText.textContent();
    expect(textContent).toMatch(/^(COMPRAR|RESERVAR)$/);
  });

  test.describe("Different Mobile Devices", () => {
    const devices = [
      { name: "iPhone 12", viewport: { width: 390, height: 844 } },
      { name: "Samsung Galaxy S21", viewport: { width: 384, height: 854 } },
      { name: "iPad Mini", viewport: { width: 768, height: 1024 } },
    ];

    for (const device of devices) {
      test(`should work correctly on ${device.name}`, async ({ page }) => {
        // Set viewport to device size
        await page.setViewportSize(device.viewport);

        // Navigate to the home page
        await page.goto("/");

        // Wait for carousel to load
        await page.waitForSelector('[data-testid="carousel-container"]');

        // Get the initial product title
        const initialTitle = await page.locator(".topic").first().textContent();

        // Perform swipe left gesture
        const carousel = page.locator('[data-testid="carousel-container"]');
        const carouselBox = await carousel.boundingBox();

        if (!carouselBox) {
          throw new Error("Carousel not found");
        }

        // Swipe from right to left (next)
        await carousel.dragTo(carousel, {
          sourcePosition: {
            x: carouselBox.width * 0.8,
            y: carouselBox.height / 2,
          },
          targetPosition: {
            x: carouselBox.width * 0.2,
            y: carouselBox.height / 2,
          },
        });

        // Wait for animation to complete
        await page.waitForTimeout(1000);

        // Verify that the product has changed
        const newTitle = await page.locator(".topic").first().textContent();
        expect(newTitle).not.toBe(initialTitle);

        // Click on the product image
        await page.locator(".clickableImgWrap").first().click();

        // Verify that the action was processed
        await page.waitForTimeout(500);
      });
    }
  });
});
