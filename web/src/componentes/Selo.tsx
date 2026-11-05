interface SeloProps {
  tipo: "status" | "prioridade";
  valor: string;
  texto: string;
}

export function Selo({ tipo, valor, texto }: SeloProps) {
  return <span className={`selo selo-${tipo}-${valor}`}>{texto}</span>;
}