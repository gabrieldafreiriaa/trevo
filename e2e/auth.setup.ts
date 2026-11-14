import { expect, test as setup } from "@playwright/test";

import { GABRIEL } from "./helpers";

setup("login do Gabriel", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(GABRIEL.email);
  await page.getByLabel("Senha").fill(GABRIEL.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: "e2e/.auth/gabriel.json" });
});
