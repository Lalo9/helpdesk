import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ErroApi, requisicao } from "../api";
import { useAuth } from "../AuthContext";
import { Selo } from "../componentes/Selo";
import {
  ROTULO_PRIORIDADE,
  ROTULO_STATUS,
  formatarData,
} from "../formatacao";
import type { PaginaChamados, Prioridade, Status } from "../tipos";

const LIMITE = 10;

export function ListaChamados() {
  const { usuario } = useAuth();
  const ehCliente = usuario?.perfil === "cliente";

  const [status, setStatus] = useState<Status | "">("");
  const [prioridade, setPrioridade] = useState<Prioridade | "">("");
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<PaginaChamados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Busca os chamados sempre que a página ou um filtro mudar
  useEffect(() => {
    let cancelado = false;

    const parametros = new URLSearchParams({
      pagina: String(pagina),
      limite: String(LIMITE),
    });
    if (status) parametros.set("status", status);
    if (prioridade) parametros.set("prioridade", prioridade);

    setCarregando(true);
    setErro("");

    requisicao<PaginaChamados>(`/chamados?${parametros}`)
      .then((dados) => {
        if (!cancelado) setResultado(dados);
      })
      .catch((e) => {
        if (!cancelado) {
          setErro(
            e instanceof ErroApi ? e.message : "Não foi possível conectar à API"
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [pagina, status, prioridade]);

  const totalPaginas = resultado
    ? Math.max(1, Math.ceil(resultado.total / LIMITE))
    : 1;

  return (
    <section>
      <div className="cabecalho-pagina">
        <h1>{ehCliente ? "Meus chamados" : "Chamados"}</h1>
        {ehCliente && (
          <Link to="/chamados/novo" className="botao">
            + Novo chamado
          </Link>
        )}
      </div>

      <div className="filtros">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as Status | "");
            setPagina(1);
          }}
        >
          <option value="">Todos os status</option>
          {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>

        <select
          value={prioridade}
          onChange={(e) => {
            setPrioridade(e.target.value as Prioridade | "");
            setPagina(1);
          }}
        >
          <option value="">Todas as prioridades</option>
          {Object.entries(ROTULO_PRIORIDADE).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="erro">{erro}</p>}

      {!resultado && !erro && <p className="carregando">Carregando...</p>}

      {resultado && resultado.dados.length === 0 && (
        <p className="vazio">Nenhum chamado encontrado.</p>
      )}

      {resultado && resultado.dados.length > 0 && (
        <>
          <div
            className="tabela-wrapper"
            style={{ opacity: carregando ? 0.6 : 1 }}
          >
            <table className="tabela">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  {!ehCliente && <th>Cliente</th>}
                  <th>Atendente</th>
                  <th>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {resultado.dados.map((chamado) => (
                  <tr key={chamado.id}>
                    <td>{chamado.id}</td>
                    <td>
                      <Link to={`/chamados/${chamado.id}`}>{chamado.titulo}</Link>
                    </td>
                    <td>{chamado.categoria}</td>
                    <td>
                      <Selo
                        tipo="status"
                        valor={chamado.status}
                        texto={ROTULO_STATUS[chamado.status]}
                      />
                    </td>
                    <td>
                      <Selo
                        tipo="prioridade"
                        valor={chamado.prioridade}
                        texto={ROTULO_PRIORIDADE[chamado.prioridade]}
                      />
                    </td>
                    {!ehCliente && <td>{chamado.cliente}</td>}
                    <td>{chamado.atendente ?? "—"}</td>
                    <td>{formatarData(chamado.atualizadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="paginacao">
            <span>
              {resultado.total} chamado(s) · página {pagina} de {totalPaginas}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="botao-secundario"
                disabled={pagina <= 1}
                onClick={() => setPagina(pagina - 1)}
              >
                ← Anterior
              </button>
              <button
                className="botao-secundario"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina(pagina + 1)}
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}