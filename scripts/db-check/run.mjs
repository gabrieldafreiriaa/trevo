/**
 * Checagem rápida do banco SEM Docker (usa PGlite, um Postgres em WebAssembly).
 * Roda todas as migrations, o seed e os testes de supabase/tests/database
 * sobre uma imitação mínima do Supabase (schema auth, papéis e um mini pgTAP).
 *
 * É uma aproximação: a fonte da verdade continua sendo `pnpm db:test`
 * (Supabase local de verdade). Uso: pnpm db:check
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const root = process.argv[2] ?? ".";
const db = new PGlite({ extensions: { pgcrypto } });
const exec = async (label, sql) => {
  try {
    await db.exec(sql);
  } catch (e) {
    console.log(`✗ ${label}: ${e.message}`);
    process.exit(1);
  }
};
await exec("prelude", readFileSync(join(here, "prelude.sql"), "utf8"));
const migs = readdirSync(join(root, "supabase/migrations")).sort();
for (const m of migs) {
  await exec(m, readFileSync(join(root, "supabase/migrations", m), "utf8"));
  console.log(`✓ migration ${m}`);
}
await exec("seed.sql", readFileSync(join(root, "supabase/seed.sql"), "utf8"));
console.log("✓ seed.sql");
const tests = readdirSync(join(root, "supabase/tests/database")).sort();
let fail = 0;
for (const t of tests) {
  let sql = readFileSync(
    join(root, "supabase/tests/database", t),
    "utf8",
  ).replace(/create extension if not exists pgtap[^;]*;/, "");
  await db.exec("truncate public._tap restart identity;");
  try {
    await db.exec(sql);
  } catch (e) {
    console.log(`✗ ${t}: erro ao rodar: ${e.message}`);
    fail++;
    await db.exec("rollback;").catch(() => {});
    continue;
  }
  // os testes fazem rollback; refaz sem rollback para ler resultados
  await db.exec("reset role;");
  const sql2 = sql.replace(/\nrollback;\s*$/, "\ncommit;");
  await db.exec("truncate public._tap restart identity;");
  try {
    await db.exec(sql2);
  } catch (e) {
    console.log(`✗ ${t}: ${e.message}`);
    fail++;
    continue;
  }
  await db.exec("reset role;");
  const { rows } = await db.query(
    "select ok, descr, detail from public._tap order by n",
  );
  for (const r of rows) {
    console.log(
      `${r.ok ? "  ✓" : "  ✗"} ${r.descr}${r.ok ? "" : "  → " + r.detail}`,
    );
    if (!r.ok) fail++;
  }
  // restaura o estado (os testes alteram dados quando commitados)
  console.log(`${t}: ${rows.length} asserções`);
}
process.exit(fail ? 1 : 0);
