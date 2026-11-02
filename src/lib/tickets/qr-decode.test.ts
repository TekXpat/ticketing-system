import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { decodeQr } from "./qr-decode";

// Draws a QR code into plain pixels, the same shape a canvas gives the scanner.
function pixelsFor(text: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const scale = 6;
  const margin = 4;
  const size = qr.modules.size;
  const dimension = (size + margin * 2) * scale;
  const data = new Uint8ClampedArray(dimension * dimension * 4).fill(255);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!qr.modules.get(row, col)) continue;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const px = (col + margin) * scale + x;
          const py = (row + margin) * scale + y;
          const index = (py * dimension + px) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
        }
      }
    }
  }
  return { data, dimension };
}

describe("decodeQr", () => {
  it("reads back the signed ticket code that was drawn into a QR", () => {
    const code = "cmv9arjj800002yovmpyvohad.Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MGFiY2RlZmdoaWo";
    const { data, dimension } = pixelsFor(code);

    expect(decodeQr(data, dimension, dimension)).toBe(code);
  });

  it("returns null when the picture has no QR code", () => {
    const blank = new Uint8ClampedArray(200 * 200 * 4).fill(255);

    expect(decodeQr(blank, 200, 200)).toBeNull();
  });
});
