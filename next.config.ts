import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o app pelo celular na mesma rede Wi-Fi (pnpm dev:celular).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  // Esconde o botão "N" do Next em desenvolvimento (atrapalhava o menu de baixo).
  devIndicators: false,
  // Cache Components desligado de propósito (decisão D12 em docs/ARCHITECTURE.md):
  // todas as telas dependem do usuário logado e de dados que mudam a todo momento.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
