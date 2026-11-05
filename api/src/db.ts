import "dotenv/config";
import { Pool, PoolClient } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Executa várias consultas como uma só operação:
// se qualquer uma falhar, todas são desfeitas.
export async function comTransacao<T>(
  operacao: (conexao: PoolClient) => Promise<T>
): Promise<T> {
  const conexao = await pool.connect();

  try {
    await conexao.query("BEGIN");
    const resultado = await operacao(conexao);
    await conexao.query("COMMIT");
    return resultado;
  } catch (erro) {
    await conexao.query("ROLLBACK");
    throw erro;
  } finally {
    conexao.release();
  }
}