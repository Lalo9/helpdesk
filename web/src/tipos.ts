export type Perfil = "cliente" | "atendente";
export type Status = "aberto" | "em_andamento" | "resolvido" | "fechado";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  status: Status;
  prioridade: Prioridade;
  categoriaId: number;
  categoria: string;
  clienteId: number;
  cliente: string;
  atendenteId: number | null;
  atendente: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PaginaChamados {
  dados: Chamado[];
  pagina: number;
  limite: number;
  total: number;
}