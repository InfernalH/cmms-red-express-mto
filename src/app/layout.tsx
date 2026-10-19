import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fracttal-AR CMMS | Gestión de Mantenimiento Red 528 Locales",
  description:
    "Sistema CMMS / GMAO Multiplataforma (Web Admin + App Móvil Offline-First) para Red de 528 Locales en Argentina - Fase 1 Climatización HVAC",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
