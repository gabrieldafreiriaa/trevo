import { expect, test } from "@playwright/test";

test("admin vê o painel do pai sem poder alterar", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Visualizando o painel de").selectOption({
    label: "Pai",
  });

  await expect(page.getByText("Você está vendo o painel de")).toBeVisible();
  await expect(page.getByRole("link", { name: "Novo lançamento" })).toHaveCount(
    0,
  );

  // Tela de criação fica bloqueada no modo leitura.
  await page.goto("/lancamentos/novo");
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Voltar ao meu painel" }).click();
  await expect(page.getByText("Você está vendo o painel de")).toHaveCount(0);
});
