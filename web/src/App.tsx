import { Route, Routes } from "react-router";
import { Layout } from "./componentes/Layout";
import { RotaProtegida } from "./componentes/RotaProtegida";
import { DetalheChamado } from "./paginas/DetalheChamado";
import { ListaChamados } from "./paginas/ListaChamados";
import { Login } from "./paginas/Login";
import { NovoChamado } from "./paginas/NovoChamado";
import { Registro } from "./paginas/Registro";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<ListaChamados />} />
          <Route path="/chamados/novo" element={<NovoChamado />} />
          <Route path="/chamados/:id" element={<DetalheChamado />} />
        </Route>
      </Route>
    </Routes>
  );
}