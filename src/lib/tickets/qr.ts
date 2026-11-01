import QRCode from "qrcode";

// The QR picture for a ticket code, as an SVG string, for the web page.
// Dark on white, so it scans in both themes.
export function ticketQrSvg(code: string): Promise<string> {
  return QRCode.toString(code, {
    type: "svg",
    margin: 2,
    width: 176,
    errorCorrectionLevel: "M",
  });
}

// The same QR as a PNG, to place inside the PDF.
export function ticketQrPng(code: string): Promise<Uint8Array> {
  return QRCode.toBuffer(code, {
    type: "png",
    margin: 2,
    width: 360,
    errorCorrectionLevel: "M",
  });
}
