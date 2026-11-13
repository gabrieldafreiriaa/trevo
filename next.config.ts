import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
