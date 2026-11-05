import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { lerToken, removerToken, requisicao, salvarToken } from "./api";
import type { Usuario } from "./tipos";

interface AuthContextoTipo {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContexto = createContext<AuthContextoTipo | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(() => lerToken() !== null);

  // Ao abrir o site, se já existe um token guardado, confere com a API quem é.
  useEffect(() => {
    if (lerToken() === null) return;

    requisicao<Usuario>("/auth/eu")
      .then(setUsuario)
      .catch(() => removerToken())
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email: string, senha: string) {
    const resposta = await requisicao<{ token: string; usuario: Usuario }>(
      "/auth/login",
      { metodo: "POST", corpo: { email, senha } }
    );
    salvarToken(resposta.token);
    setUsuario(resposta.usuario);
  }

  function sair() {
    removerToken();
    setUsuario(null);
  }

  return (
    <AuthContexto.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContexto.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContexto);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro do AuthProvider");
  }
  return contexto;
}