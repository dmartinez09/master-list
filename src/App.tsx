import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Countries from './pages/Countries';
import Maturity from './pages/Maturity';
import Execution from './pages/Execution';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portafolio" element={<Portfolio />} />
        <Route path="/paises" element={<Countries />} />
        <Route path="/madurez" element={<Maturity />} />
        <Route path="/ejecucion" element={<Execution />} />
      </Routes>
    </BrowserRouter>
  );
}
