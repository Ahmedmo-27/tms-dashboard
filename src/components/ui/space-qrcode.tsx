"use client";

import { useEffect, useState } from "react";
import {
  generateQRCode,
  getOpenGymQrPayload,
  getPtQrPayload,
} from "@/lib/utils/qrcodes";

type StaticQrKind = "openGym" | "pt";

interface SpaceQRCodeProps {
  locationId: string;
  branchName: string;
  kind?: StaticQrKind;
}

const QR_CONFIG: Record<
  StaticQrKind,
  {
    label: string;
    fileSuffix: string;
    payload: (locationId: string) => string;
  }
> = {
  openGym: {
    label: "Open Gym",
    fileSuffix: "opengym-qr",
    payload: getOpenGymQrPayload,
  },
  pt: {
    label: "Personal Training",
    fileSuffix: "pt-qr",
    payload: getPtQrPayload,
  },
};

export default function SpaceQRCode({
  locationId,
  branchName,
  kind = "openGym",
}: SpaceQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const config = QR_CONFIG[kind];

  useEffect(() => {
    generateQRCode(QR_CONFIG[kind].payload(locationId)).then(setQrUrl);
  }, [locationId, kind]);

  const downloadImage = () => {
    const link = document.createElement("a");
    link.download = `${branchName.toLowerCase().replace(/\s+/g, "-")}-${config.fileSuffix}.png`;
    link.href = qrUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center bg-white/20 shadow-lg rounded-xl p-4">
      <h2 className="text-sm font-semibold mb-2 text-center w-full">
        {branchName} — {config.label}
      </h2>
      {qrUrl && (
        <img
          src={qrUrl}
          alt={`${branchName} ${config.label} QR Code`}
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
