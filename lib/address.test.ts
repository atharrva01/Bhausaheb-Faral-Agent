import { describe, expect, it } from "vitest";
import { validateAddress } from "./address";

describe("validateAddress", () => {
  it("accepts valid addresses per country", () => {
    expect(validateAddress("US", "nj", "08817")).toEqual([]);
    expect(validateAddress("CA", "ON", "L6X 1A3")).toEqual([]);
    expect(validateAddress("AU", "NSW", "2150")).toEqual([]);
    expect(validateAddress("GB", null, "LE1 3HQ")).toEqual([]);
    expect(validateAddress("AE", null, null)).toEqual([]);
  });

  it("rejects a US address sent to Canada (the bug from order #1027)", () => {
    const issues = validateAddress("CA", "NJ", "08817");
    expect(issues.map((i) => i.field).sort()).toEqual(["postalCode", "state"]);
  });

  it("requires state where needed and checks formats", () => {
    expect(validateAddress("US", "", "08817")[0]).toMatchObject({ field: "state" });
    expect(validateAddress("US", "NJ", "8817")[0]).toMatchObject({ field: "postalCode" });
    expect(validateAddress("GB", null, "")[0]).toMatchObject({ field: "postalCode" });
  });
});
