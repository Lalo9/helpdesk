import { Link, useParams } from "react-router";

export function DetalheChamado() {
  const { id } = useParams();

  return (
    <section>
      <Link to="/" className="voltar">
        ← Voltar para a lista
      </Link>
      <h1>Chamado #{id}</h1>
      <p>A tela de detalhes e da conversa chega na próxima etapa.</p>
    </section>
  );
}