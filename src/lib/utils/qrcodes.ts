import QRCode from "qrcode";

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, { margin: 2 });
    return qrDataUrl;
  } catch (err) {
    console.error("QR generation failed", err);
    return "";
  }
}


