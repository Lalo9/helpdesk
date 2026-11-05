import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { pool } from "../db";
import { autenticar } from "../middlewares/autenticacao";
import { conferirSenha, gerarHash } from "../senha";

export const rotasAuth = Router();

const registroSchema = z.object({
  nome: z.string().trim().min(2, "O nome precisa ter pelo menos 2 caracteres"),
  email: z.email("E-mail inválido"),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

const loginSchema = z.object({
  email: z.email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

function respostaInvalida(erro: z.ZodError) {
  return {
    erro: "Dados inválidos",
    detalhes: erro.issues.map((problema) => ({
      campo: problema.path.join("."),
      mensagem: problema.message,
    })),
  };
}

rotasAuth.post("/registro", async (req, res) => {
  const resultado = registroSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json(respostaInvalida(resultado.error));
    return;
  }

  const { nome, email, senha } = resultado.data;
  const senhaHash = await gerarHash(senha);

  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, perfil, criado_em`,
      [nome, email.toLowerCase(), senhaHash]
    );
    res.status(201).json(rows[0]);
  } catch (erro) {
    if ((erro as { code?: string }).code === "23505") {
      res.status(409).json({ erro: "Este e-mail já está cadastrado" });
      return;
    }
    throw erro;
  }
});

rotasAuth.post("/login", async (req, res) => {
  const resultado = loginSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json(respostaInvalida(resultado.error));
    return;
  }

  const { email, senha } = resultado.data;

  const { rows } = await pool.query(
    "SELECT id, nome, email, perfil, senha_hash FROM usuarios WHERE email = $1",
    [email.toLowerCase()]
  );
  const usuario = rows[0];

  const senhaCorreta = usuario
    ? await conferirSenha(senha, usuario.senha_hash)
    : false;

  if (!usuario || !senhaCorreta) {
    res.status(401).json({ erro: "E-mail ou senha inválidos" });
    return;
  }

  const token = jwt.sign({ perfil: usuario.perfil }, config.jwtSecret, {
    subject: String(usuario.id),
    expiresIn: 8 * 60 * 60,
  });

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    },
  });
});

rotasAuth.get("/eu", autenticar, async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, nome, email, perfil, criado_em FROM usuarios WHERE id = $1",
    [res.locals.usuario.id]
  );

  if (rows.length === 0) {
    res.status(404).json({ erro: "Usuário não encontrado" });
    return;
  }

  res.json(rows[0]);
});