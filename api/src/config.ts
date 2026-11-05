import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith("troque-por")) {
  throw new Error(
    "Defina um JWT_SECRET próprio no arquivo .env (mínimo de 32 caracteres)"
  );
}

export const config = {
  porta: Number(process.env.PORT) || 3000,
  jwtSecret,
};