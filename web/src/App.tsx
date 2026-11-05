import { Route, Routes } from "react-router";
import { Layout } from "./componentes/Layout";
import { RotaProtegida } from "./componentes/RotaProtegida";
import { Inicio } from "./paginas/Inicio";
import { Login } from "./paginas/Login";
import { Registro } from "./paginas/Registro";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
        </Route>
      </Route>
    </Routes>
  );
}