import { Navigate, Outlet } from "react-router";
import { useAuth } from "../AuthContext";

export function RotaProtegida() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <p className="carregando">Carregando...</p>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}