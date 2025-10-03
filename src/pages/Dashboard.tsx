
import React from 'react'
import { Link } from 'react-router-dom'
import { useClientes } from '../hooks/useClientes'
import { useRecordatorios } from '../hooks/useRecordatorios'
import AlertasWidget from '../components/AlertasWidget'
import {Users, Calendar, DollarSign, TrendingUp, Plus, Clock, AlertCircle} from 'lucide-react'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

const Dashboard: React.FC = () => {
  const { clientes, loading } = useClientes()
  const { getRecordatoriosPendientes } = useRecordatorios()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const recordatoriosPendientes = getRecordatoriosPendientes()
  
  // Estadísticas
  const clientesActivos = clientes.filter(c => c.estado === 'confirmado' || c.estado === 'en_proceso').length
  const clientesPotenciales = clientes.filter(c => c.estado === 'potencial').length
  const ingresosTotales = clientes.reduce((sum, c) => sum + (c.montoAbonado || 0), 0)
  const ingresosPendientes = clientes.reduce((sum, c) => sum + ((c.montoTotal || 0) - (c.montoAbonado || 0)), 0)

  // Próximos eventos (siguientes 30 días)
  const ahora = new Date()
  const en30Dias = addDays(ahora, 30)
  const proximosEventos = clientes
    .filter(cliente => {
      const fechaEvento = parseISO(cliente.fechaBoda)
      return isAfter(fechaEvento, ahora) && isBefore(fechaEvento, en30Dias)
    })
    .sort((a, b) => parseISO(a.fechaBoda).getTime() - parseISO(b.fechaBoda).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Resumen de tu negocio de bodas</p>
        </div>
        <Link to="/agregar-cliente" className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </Link>
      </div>

      {/* Alertas */}
      <AlertasWidget />

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-gray-900">{clientesActivos}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Potenciales</p>
              <p className="text-2xl font-bold text-gray-900">{clientesPotenciales}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">€{ingresosTotales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes Cobro</p>
              <p className="text-2xl font-bold text-gray-900">€{ingresosPendientes.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos eventos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
            <Link to="/calendario" className="text-blue-600 hover:text-blue-700 text-sm">
              Ver calendario
            </Link>
          </div>
          
          {proximosEventos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay eventos próximos</p>
          ) : (
            <div className="space-y-3">
              {proximosEventos.map(cliente => (
                <div key={cliente._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{cliente.nombres}</p>
                    <p className="text-sm text-gray-600">{cliente.venue}, {cliente.ciudad}</p>
                    <p className="text-sm text-gray-500">{cliente.servicio}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(parseISO(cliente.fechaBoda), 'dd MMM', { locale: es })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(cliente.fechaBoda), 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recordatorios pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recordatorios Pendientes</h3>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {recordatoriosPendientes.length}
            </span>
          </div>
          
          {recordatoriosPendientes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay recordatorios pendientes</p>
          ) : (
            <div className="space-y-3">
              {recordatoriosPendientes.slice(0, 5).map(recordatorio => (
                <div key={recordatorio._id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{recordatorio.mensaje}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(recordatorio.fechaRecordatorio), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    recordatorio.prioridad === 'urgente' ? 'bg-red-100 text-red-800' :
                    recordatorio.prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {recordatorio.prioridad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/agregar-cliente" className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Plus className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">Agregar Cliente</span>
          </Link>
          
          <Link to="/calendario" className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-green-900 font-medium">Ver Calendario</span>
          </Link>
          
          <Link to="/clientes" className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-purple-900 font-medium">Gestionar Clientes</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
