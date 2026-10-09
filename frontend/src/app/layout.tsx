import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Tipografía del mockup (docs/diseno).
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "PractiYA", template: "%s · PractiYA" },
  description: "La red donde estudiantes y empresas se encuentran para contratos de aprendizaje.",
};

export const viewport: Viewport = {
  themeColor: "#004961",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={serif.variable}>
      <body>{children}</body>
    </html>
  );
}
