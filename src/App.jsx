import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';

import Home        from './pages/Home';
import Culto       from './pages/Culto';
import Financeiro  from './pages/Financeiro';
import Programacao from './pages/Programacao';
import Teologia    from './pages/Teologia';
import Admin       from './pages/Admin';
import Grupos      from './pages/Grupos';
import Oracao      from './pages/Oracao';
import Sermoes     from './pages/Sermoes';
import Perfil      from './pages/Perfil';
import Usuario     from './pages/Usuario';
import Avisos      from './pages/Avisos';
import Devocional  from './pages/Devocional';
import Biblia      from './pages/Biblia';
import Aconselhamento from './pages/Aconselhamento';
import Testemunhos from './pages/Testemunhos';
import Galeria     from './pages/Galeria';
import Voluntarios from './pages/Voluntarios';
import Carteira    from './pages/Carteira';
import Busca       from './pages/Busca';
import Contribuir  from './pages/Contribuir';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/culto"         element={<Culto />} />
        <Route path="/financeiro"    element={<Financeiro />} />
        <Route path="/programacao"   element={<Programacao />} />
        <Route path="/teologia"      element={<Teologia />} />
        <Route path="/admin"         element={<Admin />} />
        <Route path="/grupos"        element={<Grupos />} />
        <Route path="/oracao"        element={<Oracao />} />
        <Route path="/sermoes"       element={<Sermoes />} />
        <Route path="/perfil"        element={<Perfil />} />
        <Route path="/usuario"       element={<Usuario />} />
        <Route path="/avisos"        element={<Avisos />} />
        <Route path="/devocional"    element={<Devocional />} />
        <Route path="/biblia"        element={<Biblia />} />
        <Route path="/aconselhamento" element={<Aconselhamento />} />
        <Route path="/testemunhos"   element={<Testemunhos />} />
        <Route path="/galeria"       element={<Galeria />} />
        <Route path="/voluntarios"   element={<Voluntarios />} />
        <Route path="/carteira"      element={<Carteira />} />
        <Route path="/busca"         element={<Busca />} />
        <Route path="/contribuir"    element={<Contribuir />} />
      </Routes>
      <BottomNav />
    </Router>
  );
}

export default App;
