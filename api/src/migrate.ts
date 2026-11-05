import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "./db";

async function migrar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nome        VARCHAR(255) PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const pasta = path.join(__dirname, "..", "migrations");
  const arquivos = fs
    .readdirSync(pasta)
    .filter((arquivo) => arquivo.endsWith(".sql"))
    .sort();

  for (const arquivo of arquivos) {
    const jaAplicada = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE nome = $1",
      [arquivo]
    );

    if (jaAplicada.rowCount) {
      console.log(`- ${arquivo} (já aplicada)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(pasta, arquivo), "utf8");
    const conexao = await pool.connect();

    try {
      await conexao.query("BEGIN");
      await conexao.query(sql);
      await conexao.query("INSERT INTO schema_migrations (nome) VALUES ($1)", [arquivo]);
      await conexao.query("COMMIT");
      console.log(`✔ ${arquivo} aplicada`);
    } catch (erro) {
      await conexao.query("ROLLBACK");
      console.error(`✘ Erro em ${arquivo}:`, erro);
      process.exitCode = 1;
      break;
    } finally {
      conexao.release();
    }
  }

  await pool.end();
}

migrar();