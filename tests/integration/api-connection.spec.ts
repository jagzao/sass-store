/**
 * API Connection Test
 * 
 * Simple test to verify API is accessible on port 4000
 */

import { describe, it, expect } from "vitest";

describe("API Connection Test", () => {
  const baseUrl = "http://localhost:4000";

  it("should connect to API on port 4000", async () => {
    try {
      const response = await fetch(`${baseUrl}/`, {
        method: "GET",
      });

      expect(response.status).toBeLessThan(500);
      console.log("API Connection successful:", response.status);
    } catch (error) {
      console.error("API Connection failed:", error);
      throw error;
    }
  });

  it("should return 404 for non-existent endpoint", async () => {
    try {
      const response = await fetch(`${baseUrl}/api/nonexistent`, {
        method: "GET",
      });

      expect(response.status).toBe(404);
      console.log("API returns 404 for non-existent endpoint as expected");
    } catch (error) {
      console.error("API Connection failed:", error);
      throw error;
    }
  });
});
