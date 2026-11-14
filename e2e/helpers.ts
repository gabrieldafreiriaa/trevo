import { expect, type Locator, type Page } from "@playwright/test";

/** Usuários do seed (supabase/seed.sql). */
export const GABRIEL = { email: "gabriel@trevo.local", password: "trevo123" };

/** "R$ 1.234,56" -> 123456 */
export async function readCents(locator: Locator): Promise<number> {
  const text = await locator.innerText();
  const digits = text.replace(/\D/g, "");
  return Number(digits || "0");
}

/** Texto único para não colidir com dados de execuções anteriores. */
export function unique(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`;
}

/** Escolhe uma opção num grupo de botões (ChoiceChips). */
export async function choose(page: Page, group: string, option: string) {
  await page
    .getByRole("group", { name: group, exact: true })
    .getByText(option, { exact: true })
    .click();
}

/** Valor realizado do card "Entradas" ou "Saídas" do dashboard. */
export async function dashboardFlow(page: Page, label: "Entradas" | "Saídas") {
  await page.goto("/");
  const value = page
    .getByRole("region", { name: label, exact: true })
    .getByTestId("flow-value");
  await expect(value).toBeVisible();
  return readCents(value);
}
