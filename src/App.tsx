
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import AgregarCliente from './pages/AgregarCliente'
import ClienteDetalle from './pages/ClienteDetalle'
import Calendario from './pages/Calendario'
import Contabilidad from './pages/Contabilidad'
import Tasks from './pages/Tasks'
import TareasPersonal from './pages/TareasPersonal'
import Contenido from './pages/Contenido'
import RespaldoAutomatico from './pages/RespaldoAutomatico'
import Servicios from './pages/Servicios'
import InformacionGeneral from './pages/InformacionGeneral'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/agregar" element={<AgregarCliente />} />
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tareas-personal" element={<TareasPersonal />} />
          <Route path="/contenido" element={<Contenido />} />
          <Route path="/respaldo" element={<RespaldoAutomatico />} />
          <Route path="/servicios" element={<Servicios />} />
          <Route path="/informacion-general" element={<InformacionGeneral />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
