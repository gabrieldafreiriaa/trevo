import { expect, test } from "@playwright/test";

import { choose, dashboardFlow, unique } from "./helpers";

test("gasto pago entra na lista e soma nas saídas do mês", async ({ page }) => {
  const before = await dashboardFlow(page, "Saídas");
  const description = unique("Mercado E2E");

  await page.goto("/lancamentos/novo");
  await page.getByRole("textbox", { name: "Valor", exact: true }).fill("12345");
  await page.getByLabel("Descrição").fill(description);
  await choose(page, "Categoria", "Mercado");
  await choose(page, "Forma de pagamento", "Pix");
  await choose(page, "Situação", "Pago");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();

  await expect(page).toHaveURL(/\/lancamentos\?mes=/);
  await expect(page.getByText(description)).toBeVisible();

  expect(await dashboardFlow(page, "Saídas")).toBe(before + 12345);
});

test("compra parcelada cria uma parcela por mês", async ({ page }) => {
  const description = unique("TV E2E");

  await page.goto("/lancamentos/novo");
  await page.getByRole("textbox", { name: "Valor", exact: true }).fill("30000");
  await page.getByLabel("Descrição").fill(description);
  await choose(page, "Categoria", "Compras");
  await choose(page, "Forma de pagamento", "Cartão de crédito");
  await choose(page, "Repetir", "Parcelado");
  await page.getByLabel("Número de parcelas").fill("3");
  await choose(page, "Situação", "Pendente");
  await page.getByRole("button", { name: "Salvar lançamento" }).click();

  await expect(page).toHaveURL(/\/lancamentos\?mes=/);
  const first = page.getByRole("listitem").filter({ hasText: description });
  await expect(first).toContainText("1/3");
  await expect(first).toContainText("R$ 100,00");

  await page.getByRole("link", { name: "Próximo mês" }).click();
  await expect(
    page.getByRole("listitem").filter({ hasText: description }),
  ).toContainText("2/3");
});
