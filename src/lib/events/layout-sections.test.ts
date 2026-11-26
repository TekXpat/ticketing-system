import { describe, expect, it } from "vitest";
import { layoutName, seatsWithSections } from "./layout";

describe("seat sections", () => {
  it("names each seat after its section, in order", () => {
    const seats = seatsWithSections("bus", [
      { name: "Business", count: 4 },
      { name: "Economy", count: 16 },
    ]);

    expect(seats).toHaveLength(20);
    expect(seats.slice(0, 4).every((seat) => seat.section === "Business")).toBe(true);
    expect(seats[4]?.section).toBe("Economy");
    expect(new Set(seats.map((seat) => seat.label)).size).toBe(20);
  });

  it("uses six seats a row on a flight", () => {
    const seats = seatsWithSections("flight", [{ name: "main", count: 12 }]);

    expect(seats[5]?.label).toBe("1F");
    expect(seats[6]?.label).toBe("2A");
  });

  it("names layouts so equal splits are reused and different splits are not", () => {
    expect(layoutName("bus", [{ name: "main", count: 23 }])).toBe("Bus (23 seats)");
    expect(
      layoutName("bus", [
        { name: "Business", count: 4 },
        { name: "Economy", count: 16 },
      ]),
    ).toBe('Bus: [["Business",4],["Economy",16]]');
  });
});
