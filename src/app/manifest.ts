import type { MetadataRoute } from "next";

/**
 * Manifesto do PWA: permite "Adicionar à tela de início" no Android e no iPhone.
 * As cores seguem os tokens de docs/DESIGN.md (fundo e grafite).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trevo",
    short_name: "Trevo",
    description: "Controle financeiro da família.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6f4",
    theme_color: "#f5f6f4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
