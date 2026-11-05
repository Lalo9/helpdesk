import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ErroApi, requisicao } from "../api";
import { useAuth } from "../AuthContext";

export function Registro() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  async function enviar() {
    setErros([]);
    setEnviando(true);
    try {
      await requisicao("/auth/registro", {
        metodo: "POST",
        corpo: { nome, email, senha },
      });
      await entrar(email, senha);
      navegar("/");
    } catch (e) {
      if (e instanceof ErroApi) {
        setErros(
          e.detalhes.length > 0 ? e.detalhes.map((d) => d.mensagem) : [e.message]
        );
      } else {
        setErros(["Não foi possível conectar à API"]);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="cartao-centralizado">
      <h1>Criar conta</h1>
      <p className="subtitulo">Cadastre-se para abrir chamados</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>

        {erros.length > 0 && (
          <div className="erro">
            {erros.map((mensagem) => (
              <div key={mensagem}>{mensagem}</div>
            ))}
          </div>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="rodape-cartao">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </main>
  );
}