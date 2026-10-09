import type { Config } from "tailwindcss";

/**
 * Paleta del mockup (docs/diseno): teal como único color de acción,
 * magenta oscuro solo para estados de éxito/error y marca.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          900: "#004961",
          700: "#006786",
          500: "#0088B0",
          100: "#E9F8FF",
          50: "#CBEEFF",
        },
        ink: {
          DEFAULT: "#201E1D",
          2: "#444141",
          3: "#7D7979",
        },
        line: "#EAE9E9",
        canvas: "#F3F2F2",
        soft: "#F8F4F4",
        rose: {
          bg: "#FFF1F4",
          text: "#790E3D",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
      },
      borderRadius: {
        btn: "9px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(45,43,43,0.08)",
        frame: "0 20px 44px rgba(32,30,29,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
