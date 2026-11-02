import { describe, expect, it } from "vitest";
import { busSeats } from "./layout";

describe("busSeats", () => {
  it("makes exactly the number of seats asked for, with unique labels", () => {
    const seats = busSeats(23);

    expect(seats).toHaveLength(23);
    expect(new Set(seats.map((seat) => seat.label)).size).toBe(23);
  });

  it("fills rows of four, and the last row may be short", () => {
    const seats = busSeats(23);

    expect(seats[0]).toEqual({ label: "1A", rowIndex: 0, colIndex: 0 });
    expect(seats[3]).toEqual({ label: "1D", rowIndex: 0, colIndex: 3 });
    expect(seats[22]).toEqual({ label: "6C", rowIndex: 5, colIndex: 2 });
  });

  it("gives the 20 seats of the demo bus", () => {
    expect(busSeats(20)).toHaveLength(20);
    expect(busSeats(20)[19]?.label).toBe("5D");
  });
});
