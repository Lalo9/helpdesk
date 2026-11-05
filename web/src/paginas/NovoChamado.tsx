import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { ErroApi, requisicao } from "../api";
import { useAuth } from "../AuthContext";
import { ROTULO_PRIORIDADE } from "../formatacao";
import type { Categoria, Chamado, Prioridade } from "../tipos";

export function NovoChamado() {
  const { usuario } = useAuth();
  const navegar = useNavigate();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    requisicao<Categoria[]>("/categorias")
      .then(setCategorias)
      .catch(() => setErros(["Não foi possível carregar as categorias"]));
  }, []);

  // Só clientes abrem chamados
  if (usuario?.perfil !== "cliente") {
    return <Navigate to="/" replace />;
  }

  async function enviar() {
    if (categoriaId === "") {
      setErros(["Selecione uma categoria"]);
      return;
    }

    setErros([]);
    setEnviando(true);
    try {
      const criado = await requisicao<Chamado>("/chamados", {
        metodo: "POST",
        corpo: {
          titulo,
          descricao,
          categoriaId: Number(categoriaId),
          prioridade,
        },
      });
      navegar(`/chamados/${criado.id}`);
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
    <section>
      <Link to="/" className="voltar">
        ← Voltar para a lista
      </Link>

      <div className="cartao">
        <h1>Novo chamado</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar();
          }}
        >
          <label>
            Título
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Resuma o problema em uma frase"
            />
          </label>

          <label>
            Categoria
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Prioridade
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as Prioridade)}
            >
              {Object.entries(ROTULO_PRIORIDADE).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>

          <label>
            Descrição
            <textarea
              rows={6}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Explique com detalhes o que está acontecendo"
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
            {enviando ? "Enviando..." : "Abrir chamado"}
          </button>
        </form>
      </div>
    </section>
  );
}