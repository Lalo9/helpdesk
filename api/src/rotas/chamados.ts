import { Router } from "express";
import { z } from "zod";
import { comTransacao, pool } from "../db";
import { autenticar } from "../middlewares/autenticacao";
import { exigirPerfil } from "../middlewares/perfil";

export const rotasChamados = Router();

rotasChamados.use(autenticar);

const STATUS = ["aberto", "em_andamento", "resolvido", "fechado"] as const;
const PRIORIDADES = ["baixa", "media", "alta", "urgente"] as const;

const novoChamadoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "O título precisa ter pelo menos 5 caracteres")
    .max(150, "O título pode ter no máximo 150 caracteres"),
  descricao: z
    .string()
    .trim()
    .min(10, "A descrição precisa ter pelo menos 10 caracteres"),
  categoriaId: z.number("Informe a categoria (um número)").int().positive(),
  prioridade: z.enum(PRIORIDADES).default("media"),
});

const filtroSchema = z.object({
  status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(10),
});

const atualizacaoSchema = z
  .object({
    status: z.enum(STATUS).optional(),
    prioridade: z.enum(PRIORIDADES).optional(),
  })
  .refine(
    (dados) => dados.status !== undefined || dados.prioridade !== undefined,
    "Informe o status e/ou a prioridade"
  );

// O mesmo SELECT é usado em várias rotas: traz o chamado com os nomes
// da categoria, do cliente e do atendente (se houver).
const SELECT_CHAMADO = `
  SELECT c.id, c.titulo, c.descricao, c.status, c.prioridade,
         c.categoria_id AS "categoriaId", cat.nome AS categoria,
         c.cliente_id   AS "clienteId",   cli.nome AS cliente,
         c.atendente_id AS "atendenteId", atd.nome AS atendente,
         c.criado_em AS "criadoEm", c.atualizado_em AS "atualizadoEm"
    FROM chamados c
    JOIN categorias cat    ON cat.id = c.categoria_id
    JOIN usuarios cli      ON cli.id = c.cliente_id
    LEFT JOIN usuarios atd ON atd.id = c.atendente_id
`;

async function buscarChamado(id: number) {
  const { rows } = await pool.query(`${SELECT_CHAMADO} WHERE c.id = $1`, [id]);
  return rows[0];
}

function lerId(valor: unknown): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function respostaInvalida(erro: z.ZodError) {
  return {
    erro: "Dados inválidos",
    detalhes: erro.issues.map((problema) => ({
      campo: problema.path.join("."),
      mensagem: problema.message,
    })),
  };
}

// Abrir chamado (só cliente)
rotasChamados.post("/", exigirPerfil("cliente"), async (req, res) => {
  const resultado = novoChamadoSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json(respostaInvalida(resultado.error));
    return;
  }

  const { titulo, descricao, categoriaId, prioridade } = resultado.data;

  try {
    const { rows } = await pool.query(
      `INSERT INTO chamados (titulo, descricao, prioridade, categoria_id, cliente_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [titulo, descricao, prioridade, categoriaId, res.locals.usuario.id]
    );
    res.status(201).json(await buscarChamado(rows[0].id));
  } catch (erro) {
    if ((erro as { code?: string }).code === "23503") {
      res.status(400).json({ erro: "Categoria inexistente" });
      return;
    }
    throw erro;
  }
});

// Listar chamados (cliente vê só os seus; atendente vê todos)
rotasChamados.get("/", async (req, res) => {
  const filtros = filtroSchema.safeParse(req.query);
  if (!filtros.success) {
    res.status(400).json(respostaInvalida(filtros.error));
    return;
  }

  const { status, prioridade, categoriaId, pagina, limite } = filtros.data;
  const usuario = res.locals.usuario;

  const condicoes: string[] = [];
  const valores: unknown[] = [];

  if (usuario.perfil === "cliente") {
    valores.push(usuario.id);
    condicoes.push(`c.cliente_id = $${valores.length}`);
  }
  if (status) {
    valores.push(status);
    condicoes.push(`c.status = $${valores.length}`);
  }
  if (prioridade) {
    valores.push(prioridade);
    condicoes.push(`c.prioridade = $${valores.length}`);
  }
  if (categoriaId) {
    valores.push(categoriaId);
    condicoes.push(`c.categoria_id = $${valores.length}`);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
  const deslocamento = (pagina - 1) * limite;

  const [lista, contagem] = await Promise.all([
    pool.query(
      `${SELECT_CHAMADO} ${where}
       ORDER BY c.criado_em DESC, c.id DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, limite, deslocamento]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM chamados c ${where}`, valores),
  ]);

  res.json({
    dados: lista.rows,
    pagina,
    limite,
    total: contagem.rows[0].total,
  });
});

// Ver um chamado
rotasChamados.get("/:id", async (req, res) => {
  const id = lerId(req.params.id);
  if (id === null) {
    res.status(400).json({ erro: "Id inválido" });
    return;
  }

  const chamado = await buscarChamado(id);
  const usuario = res.locals.usuario;

  // Cliente tentando ver chamado de outra pessoa recebe 404,
  // para não revelar que esse chamado existe.
  if (!chamado || (usuario.perfil === "cliente" && chamado.clienteId !== usuario.id)) {
    res.status(404).json({ erro: "Chamado não encontrado" });
    return;
  }

  res.json(chamado);
});

// Assumir um chamado (só atendente)
rotasChamados.post("/:id/assumir", exigirPerfil("atendente"), async (req, res) => {
  const id = lerId(req.params.id);
  if (id === null) {
    res.status(400).json({ erro: "Id inválido" });
    return;
  }

  const { rows } = await pool.query(
    `UPDATE chamados
        SET atendente_id  = $1,
            status        = CASE WHEN status = 'aberto' THEN 'em_andamento' ELSE status END,
            atualizado_em = NOW()
      WHERE id = $2
        AND atendente_id IS NULL
        AND status <> 'fechado'
      RETURNING id`,
    [res.locals.usuario.id, id]
  );

  if (rows.length === 0) {
    const existe = await buscarChamado(id);
    if (!existe) {
      res.status(404).json({ erro: "Chamado não encontrado" });
      return;
    }
    res.status(409).json({ erro: "Este chamado já tem atendente ou está fechado" });
    return;
  }

  res.json(await buscarChamado(id));
});

// Mudar status e/ou prioridade (só atendente)
rotasChamados.patch("/:id", exigirPerfil("atendente"), async (req, res) => {
  const id = lerId(req.params.id);
  if (id === null) {
    res.status(400).json({ erro: "Id inválido" });
    return;
  }

  const resultado = atualizacaoSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json(respostaInvalida(resultado.error));
    return;
  }

  const atual = await buscarChamado(id);
  if (!atual) {
    res.status(404).json({ erro: "Chamado não encontrado" });
    return;
  }
  if (atual.status === "fechado") {
    res.status(409).json({ erro: "Um chamado fechado não pode ser alterado" });
    return;
  }

  const dados = resultado.data;
  const campos: string[] = [];
  const valores: unknown[] = [];

  if (dados.status !== undefined) {
    valores.push(dados.status);
    campos.push(`status = $${valores.length}`);
  }
  if (dados.prioridade !== undefined) {
    valores.push(dados.prioridade);
    campos.push(`prioridade = $${valores.length}`);
  }
  campos.push("atualizado_em = NOW()");

  valores.push(id);
  await pool.query(
    `UPDATE chamados SET ${campos.join(", ")} WHERE id = $${valores.length}`,
    valores
  );

  res.json(await buscarChamado(id));
});
// ---------- Comentários ----------

const novoComentarioSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "O comentário não pode ser vazio")
    .max(2000, "O comentário pode ter no máximo 2000 caracteres"),
});

const SELECT_COMENTARIO = `
  SELECT m.id, m.texto, m.criado_em AS "criadoEm",
         m.autor_id AS "autorId", u.nome AS autor, u.perfil AS "autorPerfil"
    FROM comentarios m
    JOIN usuarios u ON u.id = m.autor_id
`;

// Cliente só enxerga os próprios chamados; atendente enxerga todos.
function usuarioPodeVer(
  chamado: { clienteId: number },
  usuario: { id: number; perfil: string }
): boolean {
  return usuario.perfil !== "cliente" || chamado.clienteId === usuario.id;
}

// Listar os comentários de um chamado
rotasChamados.get("/:id/comentarios", async (req, res) => {
  const id = lerId(req.params.id);
  if (id === null) {
    res.status(400).json({ erro: "Id inválido" });
    return;
  }

  const chamado = await buscarChamado(id);
  if (!chamado || !usuarioPodeVer(chamado, res.locals.usuario)) {
    res.status(404).json({ erro: "Chamado não encontrado" });
    return;
  }

  const { rows } = await pool.query(
    `${SELECT_COMENTARIO}
      WHERE m.chamado_id = $1
      ORDER BY m.criado_em ASC, m.id ASC`,
    [id]
  );

  res.json(rows);
});

// Adicionar um comentário
rotasChamados.post("/:id/comentarios", async (req, res) => {
  const id = lerId(req.params.id);
  if (id === null) {
    res.status(400).json({ erro: "Id inválido" });
    return;
  }

  const resultado = novoComentarioSchema.safeParse(req.body);
  if (!resultado.success) {
    res.status(400).json(respostaInvalida(resultado.error));
    return;
  }

  const usuario = res.locals.usuario;
  const chamado = await buscarChamado(id);

  if (!chamado || !usuarioPodeVer(chamado, usuario)) {
    res.status(404).json({ erro: "Chamado não encontrado" });
    return;
  }
  if (chamado.status === "fechado") {
    res.status(409).json({ erro: "Não é possível comentar em um chamado fechado" });
    return;
  }

  const idComentario = await comTransacao(async (conexao) => {
    const { rows } = await conexao.query(
      `INSERT INTO comentarios (chamado_id, autor_id, texto)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [id, usuario.id, resultado.data.texto]
    );

    await conexao.query(
      `UPDATE chamados
          SET atualizado_em = NOW(),
              status = CASE
                         WHEN status = 'resolvido' AND $2::text = 'cliente'
                         THEN 'em_andamento'
                         ELSE status
                       END
        WHERE id = $1`,
      [id, usuario.perfil]
    );

    return rows[0].id as number;
  });

  const { rows } = await pool.query(`${SELECT_COMENTARIO} WHERE m.id = $1`, [
    idComentario,
  ]);

  res.status(201).json(rows[0]);
});