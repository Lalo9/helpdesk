import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { config } from "./config";
import { pool } from "./db";
import { rotasAuth } from "./rotas/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", async (_req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW() AS agora");
    res.json({
      sistema: "helpdesk-api",
      situacao: "no ar",
      banco: "conectado",
      horaDoBanco: resultado.rows[0].agora,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({
      sistema: "helpdesk-api",
      situacao: "no ar",
      banco: "sem conexão",
    });
  }
});

app.use("/auth", rotasAuth);

// Tratador de erros: qualquer erro inesperado cai aqui
app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

app.listen(config.porta, () => {
  console.log(`API rodando em http://localhost:${config.porta}`);
});