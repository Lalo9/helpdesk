import { NextFunction, Request, Response } from "express";

export function exigirPerfil(...perfisPermitidos: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const perfil = res.locals.usuario?.perfil;

    if (!perfisPermitidos.includes(perfil)) {
      res.status(403).json({ erro: "Você não tem permissão para esta ação" });
      return;
    }

    next();
  };
}