import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          forest: "#1B4332",
          forestDark: "#132E22",
          sage: "#40916C",
          sageLight: "#E8F5EE",
          gold: "#DDA15E",
          goldLight: "#FAF3E8",
          granite: "#343A40",
          graniteLight: "#6C757D",
          snow: "#F8F9FA",
          snowDark: "#E9ECEF",
          ochre: "#BC6C25",
        },
      },
    },
  },
  plugins: [],
};
export default config;
