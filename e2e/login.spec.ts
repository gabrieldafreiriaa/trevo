import { expect, test } from "@playwright/test";

import { GABRIEL } from "./helpers";

test.use({ storageState: { cookies: [], origins: [] } });

test("sem login, volta para a tela de entrada", async ({ page }) => {
  await page.goto("/lancamentos");
  await expect(page).toHaveURL(/\/login/);
});

test("senha errada mostra o aviso", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(GABRIEL.email);
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
