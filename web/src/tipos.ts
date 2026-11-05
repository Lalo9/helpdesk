export type Perfil = "cliente" | "atendente";
export type Status = "aberto" | "em_andamento" | "resolvido" | "fechado";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}