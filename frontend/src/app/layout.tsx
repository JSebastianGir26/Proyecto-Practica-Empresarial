import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PractiYA",
  description: "La red donde estudiantes y empresas se encuentran para prácticas de aprendizaje.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
