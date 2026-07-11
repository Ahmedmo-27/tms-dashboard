"use client";

import { useEffect, useState } from "react";
import { generateQRCode, getOpenGymQrPayload } from "@/lib/utils/qrcodes";

interface SpaceQRCodeProps {
  locationId: string;
  branchName: string;
}

export default function SpaceQRCode({
  locationId,
  branchName,
}: SpaceQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    generateQRCode(getOpenGymQrPayload(locationId)).then(setQrUrl);
  }, [locationId]);

  const downloadImage = () => {
    const link = document.createElement("a");
    link.download = `${branchName.toLowerCase().replace(/\s+/g, "-")}-opengym-qr.png`;
    link.href = qrUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center bg-white/20 shadow-lg rounded-xl p-4">
      <h2 className="text-sm font-semibold mb-2 text-center w-full">
        {branchName} — Open Gym
      </h2>
      {qrUrl && (
        <img
          src={qrUrl}
          alt={`${branchName} Open Gym QR Code`}
          className="border rounded-lg shadow w-full max-w-[300px]"
        />
      )}
      <button
        onClick={downloadImage}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
      >
        Download Code
      </button>
    </div>
  );
}
