"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns/format";
import QRCode from "qrcode";
import pica from "pica";
import toast from "react-hot-toast";
import { AlertCircle, Loader2 } from "lucide-react";

export default function QRTemplateGenerator({ scls }: { scls: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const normalizedCategory = (scls.category || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const qrTemplateSrc = `/${normalizedCategory}.jpg`;
  const clsTitle = scls.className || "Class";
  const clsId = scls._id;

  const formattedTime = (() => {
    try {
      const d = new Date(scls.startTime);
      return isNaN(d.getTime()) ? "" : format(d, "hh:mm a");
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    let isCancelled = false;

    const generate = async () => {
      setLoadStatus("loading");
      setErrorMessage(null);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!normalizedCategory) {
        setLoadStatus("error");
        setErrorMessage("Class has no category assigned.");
        return;
      }

      const bg = new Image();
      bg.crossOrigin = "anonymous";
      bg.src = qrTemplateSrc;

      bg.onload = async () => {
        if (isCancelled) return;
        try {
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

          setLoadStatus("ready");
          setErrorMessage(null);
        } catch (err: any) {
          if (isCancelled) return;
          setLoadStatus("error");
          setErrorMessage(err?.message || "Failed to generate QR code onto template");
        }
      };

      bg.onerror = () => {
        if (isCancelled) return;
        setLoadStatus("error");
        setErrorMessage(
          `Required template "${normalizedCategory}.jpg" could not be found for category "${scls.category}".`
        );
      };
    };

    generate();

    return () => {
      isCancelled = true;
    };
  }, [clsId, clsTitle, qrTemplateSrc, normalizedCategory, scls.category]);

  const downloadImage = async () => {
    if (loadStatus === "loading") {
      toast.error("Poster template is still loading. Please wait a moment.");
      return;
    }

    if (loadStatus === "error" || errorMessage) {
      toast.error(
        `Cannot download QR code: ${errorMessage || "Required template failed to load."}`
      );
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Cannot download QR code: Canvas element not found.");
      return;
    }

    setIsDownloading(true);

    try {
      const resizedCanvas = document.createElement("canvas");
      resizedCanvas.width = 1568;
      resizedCanvas.height = 1960;

      let resized = false;
      try {
        const picaInstance = pica({ features: ["js"] });
        await picaInstance.resize(canvas, resizedCanvas, {
          quality: 3,
          unsharpAmount: 80,
          unsharpThreshold: 2,
        });
        resized = true;
      } catch (picaErr) {
        console.warn("High-res Pica resize failed, falling back to original canvas:", picaErr);
      }

      const targetCanvas = resized ? resizedCanvas : canvas;

      if (resized) {
        const ctx = resizedCanvas.getContext("2d");
        if (ctx) {
          ctx.globalCompositeOperation = "destination-over";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);
        }
      }

      let timeSuffix = "poster";
      try {
        const d = new Date(scls.startTime);
        if (!isNaN(d.getTime())) {
          timeSuffix = format(d, "hh-a");
        }
      } catch {
        timeSuffix = "poster";
      }

      const safeTitle = clsTitle
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "_");
      const filename = `${safeTitle}-${timeSuffix}-poster.jpg`;

      targetCanvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Cannot download QR code: Failed to create image file.");
            setIsDownloading(false);
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);

          toast.success("QR Code poster downloaded!");
          setIsDownloading(false);
        },
        "image/jpeg",
        0.92
      );
    } catch (err: any) {
      console.error("QR download error:", err);
      toast.error(`Cannot download QR code: ${err?.message || "Failed to export image"}`);
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center bg-white/20 shadow-lg rounded-xl p-4">
      <h2 className="text-sm font-semibold mb-2 text-center w-full">
        {`${clsTitle}${scls.location ? ` — ${scls.location}` : ""}${formattedTime ? ` - ${formattedTime}` : ""}`}
      </h2>

      {errorMessage && (
        <div className="mb-3 w-full max-w-[300px] rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Template Error</span>
          </div>
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="relative w-full max-w-[300px]">
        <canvas
          ref={canvasRef}
          width={768}
          height={960}
          className={`border rounded-lg shadow w-full ${loadStatus === "error" ? "opacity-30 bg-gray-100 dark:bg-gray-800" : ""}`}
        />
        {loadStatus === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xs rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <button
        onClick={downloadImage}
        disabled={isDownloading}
        className="mt-4 min-h-11 w-full max-w-[300px] rounded bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          "Download / Print"
        )}
      </button>
    </div>
  );
}