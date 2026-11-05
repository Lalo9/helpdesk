import { useAuth } from "../AuthContext";

export function Inicio() {
  const { usuario } = useAuth();

  return (
    <section>
      <h1>Olá, {usuario?.nome}!</h1>
      <p>
        Seu perfil é <strong>{usuario?.perfil}</strong>. A lista de chamados
        chega na próxima etapa.
      </p>
    </section>
  );
}