import type { Config } from "tailwindcss";

const config: Config = {
  // ✅ ACTIVE LE MODE SOMBRE VIA CLASSE (Indispensable pour Next.js)
  darkMode: "class",

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ✅ LIAISON DES VARIABLES CSS GLOBALES
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        gold: {
          primary: "var(--gold-primary)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
