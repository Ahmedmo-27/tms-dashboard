import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/store/provider";
import { Toaster } from "react-hot-toast";

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
        <Toaster position="top-right" reverseOrder={false} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
