import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Fixa um fuso diferente do de São Paulo para garantir que o código
    // nunca dependa do fuso da máquina.
    env: { TZ: "UTC" },
  },
});
