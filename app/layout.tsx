import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title:       "For the Record",
  description: "Your life is worth recording. Every day.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#1A1A1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-studio">
      <body className="min-h-screen bg-studio text-cream antialiased">
        {children}
      </body>
    </html>
  );
}
