import type { Config } from "tailwindcss";

const config: Config {
  // Isso permite que o next-themes controle o visual adicionando a classe .dark ao <html>
  darkMode: "class", 
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Adicione outras pastas se você tiver componentes em locais diferentes
  ],
  theme: {
    extend: {
      // Aqui você pode customizar cores se o comprador do seu código quiser mudar o visual rápido
    },
  },
  plugins: [],
};
export default config;