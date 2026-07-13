import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';

import Home        from './pages/Home';
import Culto       from './pages/Culto';
import Financeiro  from './pages/Financeiro';
import Teologia    from './pages/Teologia';
import Admin       from './pages/Admin';
import Grupos      from './pages/Grupos';
import Oracao      from './pages/Oracao';
import Usuario     from './pages/Usuario';
import Avisos      from './pages/Avisos';
import Devocional  from './pages/Devocional';
import Biblia      from './pages/Biblia';
import Aconselhamento from './pages/Aconselhamento';
import Voluntarios from './pages/Voluntarios';
import Contribuir  from './pages/Contribuir';
import Evangelismo  from './pages/Evangelismo';
import Ministerios  from './pages/Ministerios';
import Instalar     from './pages/Instalar';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/culto"         element={<Culto />} />
        <Route path="/financeiro"    element={<Financeiro />} />
        <Route path="/teologia"      element={<Teologia />} />
        <Route path="/admin"         element={<Admin />} />
        <Route path="/grupos"        element={<Grupos />} />
        <Route path="/oracao"        element={<Oracao />} />
        <Route path="/usuario"       element={<Usuario />} />
        <Route path="/avisos"        element={<Avisos />} />
        <Route path="/devocional"    element={<Devocional />} />
        <Route path="/biblia"        element={<Biblia />} />
        <Route path="/aconselhamento" element={<Aconselhamento />} />
        <Route path="/voluntarios"   element={<Voluntarios />} />
        <Route path="/contribuir"    element={<Contribuir />} />
        <Route path="/evangelismo"   element={<Evangelismo />} />
        <Route path="/ministerios"   element={<Ministerios />} />
        <Route path="/instalar"      element={<Instalar />} />
      </Routes>
      <BottomNav />
    </Router>
  );
}

export default App;
