import QRCode from "qrcode";

export async function generateQRDataURL(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });
}

export async function generateQRBuffer(value: string): Promise<Buffer> {
  return QRCode.toBuffer(value, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });
}
