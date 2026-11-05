const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const CHAVE_TOKEN = "helpdesk:token";

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token: string) {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function removerToken() {
  localStorage.removeItem(CHAVE_TOKEN);
}

interface Detalhe {
  campo: string;
  mensagem: string;
}

export class ErroApi extends Error {
  status: number;
  detalhes: Detalhe[];

  constructor(mensagem: string, status: number, detalhes: Detalhe[] = []) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

interface Opcoes {
  metodo?: string;
  corpo?: unknown;
}

export async function requisicao<T>(
  caminho: string,
  opcoes: Opcoes = {}
): Promise<T> {
  const token = lerToken();

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: opcoes.metodo ?? "GET",
    headers: {
      ...(opcoes.corpo !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new ErroApi(
      dados?.erro ?? "Erro inesperado",
      resposta.status,
      dados?.detalhes ?? []
    );
  }

  return dados as T;
}