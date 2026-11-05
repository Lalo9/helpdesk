import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const TAMANHO_CHAVE = 64;

export async function gerarHash(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const chave = (await scryptAsync(senha, salt, TAMANHO_CHAVE)) as Buffer;
  return `${salt}:${chave.toString("hex")}`;
}

export async function conferirSenha(
  senha: string,
  armazenado: string
): Promise<boolean> {
  const [salt, hashGuardado] = armazenado.split(":");
  if (!salt || !hashGuardado) return false;

  const chave = (await scryptAsync(senha, salt, TAMANHO_CHAVE)) as Buffer;
  const esperado = Buffer.from(hashGuardado, "hex");

  return chave.length === esperado.length && timingSafeEqual(chave, esperado);
}