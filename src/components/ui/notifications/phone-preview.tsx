"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Smartphone, Bell, Sparkles, Wifi } from "lucide-react";

interface PhonePreviewProps {
  title: string;
  body: string;
}

export function PhonePreview({ title, body }: PhonePreviewProps) {
  const [previewMode, setPreviewMode] = useState<"lockscreen" | "banner">("lockscreen");
  const currentTime = format(new Date(), "HH:mm");
  const displayTitle = title?.trim() || "THE MIND SPACE.";
  const displayBody =
    body?.trim() || "Type your notification message to see live mobile preview...";

  return (
    <div className="flex flex-col items-center w-full max-w-[310px] mx-auto select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between w-full mb-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5 text-primary" /> Live Mobile Preview
        </span>
        <div className="flex gap-1 text-[11px] bg-muted/70 p-0.5 rounded-lg border">
          <button
            type="button"
            onClick={() => setPreviewMode("lockscreen")}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
              previewMode === "lockscreen"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lock Screen
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("banner")}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
              previewMode === "banner"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Banner
          </button>
        </div>
      </div>

      {/* Realistic Smartphone Frame (295x515) */}
      <div className="relative w-[295px] h-[515px] bg-slate-950 rounded-[40px] p-2.5 shadow-xl border-[3.5px] border-slate-800/90 ring-1 ring-slate-900/60 overflow-hidden">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-full z-30 flex items-center justify-between px-2.5 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-slate-800/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-950 ring-1 ring-emerald-500/50" />
        </div>

        {/* Screen Wallpaper */}
        <div className="relative w-full h-full rounded-[32px] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 flex flex-col justify-between p-3.5 pt-9 text-slate-100">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-300 px-1.5 z-10">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-slate-300" />
              <div className="w-4.5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-slate-200 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Screen Content Body */}
          <div className="flex-1 flex flex-col justify-start pt-2 z-10 min-h-0">
            {previewMode === "lockscreen" && (
              <div className="flex flex-col items-center my-4 animate-in fade-in-50 duration-200">
                <div className="text-4xl font-extralight tracking-tight text-slate-100">
                  {currentTime}
                </div>
                <div className="text-[11px] text-slate-300/80 mt-0.5 font-medium">
                  {format(new Date(), "EEEE, MMMM d")}
                </div>
              </div>
            )}

            {/* The Notification Card */}
            <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in-50 slide-in-from-top-3">
              {/* Header row */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="h-4.5 w-4.5 rounded-md bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-2xs">
                    TMS
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 tracking-wide truncate">
                    THE MIND SPACE
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-400 shrink-0">now</span>
              </div>

              {/* Title & Body */}
              <div className="space-y-0.5 px-0.5">
                <div className="text-[12px] font-bold text-slate-100 leading-snug line-clamp-1">
                  {displayTitle}
                </div>
                <p className="text-[11.5px] text-slate-300 leading-relaxed break-words whitespace-pre-wrap line-clamp-4">
                  {displayBody}
                </p>
              </div>
            </div>

            {previewMode === "lockscreen" && (
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <Sparkles className="h-2.5 w-2.5 text-primary/80" />
                <span>Swipe up to open app</span>
              </div>
            )}
          </div>

          {/* Bottom Lockscreen Icons & Home Indicator */}
          <div className="flex flex-col items-center gap-2 z-10 pt-1">
            {previewMode === "lockscreen" && (
              <div className="flex justify-between w-full px-3">
                <div className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-300 shadow-xs">
                  <Bell className="h-3.5 w-3.5" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-300 shadow-xs">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
            <div className="w-28 h-1 bg-white/40 rounded-full mb-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
