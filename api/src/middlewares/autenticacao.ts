import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    res.status(401).json({ erro: "Token não informado" });
    return;
  }

  const token = cabecalho.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    if (typeof payload === "string" || !payload.sub) {
      res.status(401).json({ erro: "Token inválido" });
      return;
    }

    res.locals.usuario = { id: Number(payload.sub), perfil: payload.perfil };
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}