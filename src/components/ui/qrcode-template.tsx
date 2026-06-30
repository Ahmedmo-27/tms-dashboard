"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns/format";
import QRCode from "qrcode";
import pica from "pica";

export default function QRTemplateGenerator({ scls }: { scls: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrTemplateSrc = `/${scls.category}.jpg`; 
  const clsTitle = scls.className;
  const clsId = scls._id;

  useEffect(() => {
    const generate = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bg = new Image();
      bg.src = qrTemplateSrc;
      bg.onload = async () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        const qrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(qrCanvas, clsId, {
          width: 320,
          margin: 1,
          color: {
            dark: "#FFFFFF",
            light: "#00000000",
          },
        });

        ctx.drawImage(qrCanvas, 225, 390);
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText(clsTitle, canvas.width / 2, 800);
      };
    };
    generate();
  }, [clsId, clsTitle]);

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create target canvas for resizing
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = 1568;  // Your desired width
    resizedCanvas.height = 1960; // Your desired height

    // Use Pica for high-quality resizing
    try {
      await pica().resize(canvas, resizedCanvas, {
        quality: 3,       // Highest quality (Lanczos filter)
        unsharpAmount: 80, // Optional sharpening
        unsharpThreshold: 2
      });

      // Convert to JPEG with white background
      const ctx = resizedCanvas.getContext('2d')!;
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#FFFFFF'; // White background
      ctx.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);

      const link = document.createElement("a");
      link.download = `${clsTitle}-${format(scls.startTime, "hh")}-poster.jpg`;
      link.href = resizedCanvas.toDataURL("image/jpeg", 0.92); // 92% quality
      link.click();
    } catch (error) {
      console.error('Resizing failed:', error);
      // Fallback to original if Pica fails
      const link = document.createElement("a");
      link.download = `${clsTitle}-${format(scls.startTime, "hh")}-poster.jpg`;
      link.href = canvas.toDataURL("image/jpeg");
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center bg-white/20 shadow-lg rounded-xl p-4">
      <h2 className="text-sm font-semibold mb-2 text-center w-full">
        {`${clsTitle}${scls.location ? ` — ${scls.location}` : ""} - ${format(scls.startTime, "hh:mm a")}`}
      </h2>
      <canvas
        ref={canvasRef}
        width={768}
        height={960}
        className="border rounded-lg shadow w-full max-w-[300px]"
      />
      <button
        onClick={downloadImage}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
      >
        Download Code
      </button>
    </div>
  );
}