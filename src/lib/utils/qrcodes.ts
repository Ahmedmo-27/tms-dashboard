import QRCode from "qrcode";

export function getOpenGymQrPayload(locationId: string): string {
  return `opengym:${locationId}`;
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, { margin: 2 });
    return qrDataUrl;
  } catch (err) {
    console.error("QR generation failed", err);
    return "";
  }
}


