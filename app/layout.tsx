import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Academia de Marketing Digital e IA",
    template: "%s | Academia MKT + IA",
  },
  description: "Cursos de marketing digital e inteligencia artificial dictados por instructores seleccionados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} antialiased`}>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4">{children}</main>
      </body>
    </html>
  );
}
