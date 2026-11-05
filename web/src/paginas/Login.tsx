import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ErroApi } from "../api";
import { useAuth } from "../AuthContext";

export function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  async function enviar() {
    setErro("");
    setEnviando(true);
    try {
      await entrar(email, senha);
      navegar("/");
    } catch (e) {
      setErro(
        e instanceof ErroApi ? e.message : "Não foi possível conectar à API"
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="cartao-centralizado">
      <h1>🎫 Helpdesk</h1>
      <p className="subtitulo">Entre para acompanhar seus chamados</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="rodape-cartao">
        Não tem conta? <Link to="/registro">Cadastre-se</Link>
      </p>
    </main>
  );
}