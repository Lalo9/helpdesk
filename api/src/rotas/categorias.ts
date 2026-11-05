import { Router } from "express";
import { pool } from "../db";
import { autenticar } from "../middlewares/autenticacao";

export const rotasCategorias = Router();

rotasCategorias.use(autenticar);

rotasCategorias.get("/", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, nome FROM categorias ORDER BY nome"
  );
  res.json(rows);
});