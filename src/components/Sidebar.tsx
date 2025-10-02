
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {LayoutDashboard, Users, Calendar, DollarSign, SquareCheck as CheckSquare, UserCheck, Camera, Database, Wrench, FileText, Bell, Clock} from 'lucide-react'
import { useRecordatorios } from '../hooks/useRecordatorios'
import { useClientes } from '../hooks/useClientes'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { recordatorios } = useRecordatorios()
  const { clientes } = useClientes()

  // Contar recordatorios pendientes para hoy
  const recordatoriosHoy = recordatorios?.filter(r => {
    const hoy = new Date().toDateString()
    const fechaRecordatorio = new Date(r.fecha).toDateString()
    return fechaRecordatorio === hoy && !r.completado
  }).length || 0

  // Contar clientes con pagos pendientes
  const clientesConPagosPendientes = clientes?.filter(cliente => {
    const totalPagado = cliente.pagos?.reduce((sum, pago) => sum + pago.monto, 0) || 0
    return totalPagado < cliente.precioTotal
  }).length || 0

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes', badge: clientesConPagosPendientes },
    { path: '/calendario', icon: Calendar, label: 'Calendario', badge: recordatoriosHoy },
    { path: '/contabilidad', icon: DollarSign, label: 'Contabilidad' },
    { path: '/tasks', icon: CheckSquare, label: 'Tareas' },
    { path: '/tareas-personal', icon: UserCheck, label: 'Tareas Personal' },
    { path: '/contenido', icon: Camera, label: 'Contenido' },
    { path: '/informacion-general', icon: FileText, label: 'Información General' },
    { path: '/respaldo', icon: Database, label: 'Respaldo Automático' },
    { path: '/servicios', icon: Wrench, label: 'Servicios' }
  ]

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Sistema de Gestión</h1>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <Icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar
