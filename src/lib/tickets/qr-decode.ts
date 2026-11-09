import jsQR from "jsqr";

// Reads a QR code from raw pixels (RGBA, as a canvas gives them).
// Returns the text inside, or null when there is no readable QR code.
export function decodeQr(data: Uint8ClampedArray, width: number, height: number): string | null {
  return jsQR(data, width, height)?.data ?? null;
}
