// Using globals instead of imports since globals: true in Vitest config

describe("MinimalTestCheck", () => {
  it("works with globals", () => {
    expect(1).toBe(1);
  });
});
