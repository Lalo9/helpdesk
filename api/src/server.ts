import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db";

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

const porta = Number(process.env.PORT) || 3000;

app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`);
});