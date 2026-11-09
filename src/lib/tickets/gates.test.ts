import { describe, expect, it } from "vitest";
import { findGate, gateForKind } from "./gates";

describe("gates", () => {
  it("finds a gate by its link name", () => {
    expect(findGate("buses")?.label).toBe("Buses");
    expect(findGate("concerts")?.kind).toBe("concert");
  });

  it("returns nothing for an unknown gate", () => {
    expect(findGate("airport")).toBeUndefined();
    expect(findGate("")).toBeUndefined();
  });

  it("maps an event kind to its gate, ignoring case and spaces", () => {
    expect(gateForKind("bus")?.slug).toBe("buses");
    expect(gateForKind(" Concert ")?.slug).toBe("concerts");
    expect(gateForKind("football")).toBeUndefined();
  });
});
