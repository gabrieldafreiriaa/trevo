import { expect, test } from "@playwright/test";

import { unique } from "./helpers";

test("venda parcelada com entrada gera o carnê certo", async ({ page }) => {
  const name = unique("Cliente E2E");

  await page.goto("/clientes/novo");
  await page.getByLabel("Nome").fill(name);
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();

  await page.getByRole("link", { name: "Registrar venda" }).click();
  await page.getByLabel("O que foi vendido").fill("Notebook");
  await page
    .getByRole("textbox", { name: "Total da venda", exact: true })
    .fill("100000");
  await page.getByLabel("Parcelas", { exact: true }).fill("5");
  await page.getByRole("checkbox", { name: /Teve entrada/ }).check();
  await page.getByRole("textbox", { name: "Valor da entrada" }).fill("20000");
  await page.getByRole("button", { name: "Registrar venda" }).click();

  // Total de R$ 1.000 com R$ 200 de entrada: 5 parcelas de R$ 160.
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(
    page.getByText("Entrada", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("5/5")).toBeVisible();
  await expect(page.getByText("R$ 160,00")).toHaveCount(5);
});
