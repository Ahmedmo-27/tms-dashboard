import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/store/provider";
import { Toaster } from "react-hot-toast";
import { PageProgressBar } from "@/components/ui/loading/page-progress-bar";

export const metadata: Metadata = {
  title: "TMS Dashboard",
  description: "TMS Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased"
      >
        <PageProgressBar />
        <Toaster position="top-right" reverseOrder={false} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
