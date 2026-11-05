import { Link, Outlet } from "react-router";
import { useAuth } from "../AuthContext";

export function Layout() {
  const { usuario, sair } = useAuth();

  return (
    <>
      <header className="topo">
        <Link to="/" className="logo">
          🎫 Helpdesk
        </Link>
        <div className="topo-usuario">
          <span>
            {usuario?.nome} · {usuario?.perfil}
          </span>
          <button className="botao-secundario" onClick={sair}>
            Sair
          </button>
        </div>
      </header>
      <main className="conteudo">
        <Outlet />
      </main>
    </>
  );
}