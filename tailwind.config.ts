// tailwind.config.ts
import type { Config } from 'tailwindcss';

// ADICIONE O "=" DEPOIS DE : Config
const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... resto do seu código
};

export default config;
