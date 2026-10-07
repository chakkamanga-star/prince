import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MootCourt AI — Prepare Like Counsel. Face the Bench Before You Face the Court.",
  description: "An AI-powered moot court preparation system for legal research, memorial drafting, citation verification, oral advocacy and realistic Bench simulation.",
  keywords: ["moot court", "legal research", "oral advocacy", "memorial drafting", "bench simulation", "Indian law"],
  openGraph: {
    title: "MootCourt AI",
    description: "Prepare the Argument. Challenge the Law. Face the Bench.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#0f1117] text-[#e8e4d8]`}>
        {children}
      </body>
    </html>
  );
}
