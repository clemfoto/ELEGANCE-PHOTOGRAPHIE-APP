
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useClientes } from '../hooks/useClientes'
import {Plus, Search, Filter, Eye, Edit, Calendar, DollarSign, MapPin, Phone, Mail, AlertTriangle} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const Clientes: React.FC = () => {
  const { clientes, loading, detectarCoincidenciasFechas } = useClientes()
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('todos')
  const [servicioFilter, setServicioFilter] = useState<string>('todos')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const coincidenciasFechas = detectarCoincidenciasFechas()
  
  // Filtrar clientes con validaciones defensivas
  const clientesFiltrados = clientes.filter(cliente => {
    try {
      if (!cliente) return false
      
      const nombres = cliente.nombres || ''
      const ciudad = cliente.ciudad || ''
      const venue = cliente.venue || ''
      const searchTermLower = (searchTerm || '').toLowerCase()
      
      const matchesSearch = nombres.toLowerCase().includes(searchTermLower) ||
                           ciudad.toLowerCase().includes(searchTermLower) ||
                           venue.toLowerCase().includes(searchTermLower)
      
      const matchesEstado = estadoFilter === 'todos' || cliente.estado === estadoFilter
      const matchesServicio = servicioFilter === 'todos' || cliente.servicio?.tipo === servicioFilter
      
      return matchesSearch && matchesEstado && matchesServicio
    } catch (error) {
      console.warn('Error filtering cliente:', cliente, error)
      return false
    }
  })

  const getEstadoColor = (estado: string) => {
    if (!estado || typeof estado !== 'string') return 'bg-gray-100 text-gray-800'
    
    switch (estado) {
      case 'potencial': return 'bg-yellow-100 text-yellow-800'
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'en_proceso': return 'bg-blue-100 text-blue-800'
      case 'completado': return 'bg-gray-100 text-gray-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServicioColor = (servicio: string) => {
    if (!servicio || typeof servicio !== 'string') return 'bg-gray-100 text-gray-800'
    
    switch (servicio) {
      case 'fotografia': return 'bg-purple-100 text-purple-800'
      case 'video': return 'bg-indigo-100 text-indigo-800'
      case 'fotografia_video': return 'bg-pink-100 text-pink-800'
      case 'album': return 'bg-orange-100 text-orange-800'
      case 'paquete_completo': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const tieneCoincidenciaFecha = (cliente: any) => {
    try {
      if (!cliente || !cliente._id) return false
      
      return coincidenciasFechas.some(coincidencia => 
        coincidencia.clientes && coincidencia.clientes.some(c => c._id === cliente._id)
      )
    } catch (error) {
      console.warn('Error checking fecha coincidencia:', cliente, error)
      return false
    }
  }

  const formatFechaBoda = (fechaBoda: any) => {
    try {
      if (!fechaBoda || typeof fechaBoda !== 'string') {
        return 'Fecha no definida'
      }
      
      const date = parseISO(fechaBoda)
      if (isNaN(date.getTime())) {
        return 'Fecha inválida'
      }
      
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es })
    } catch (error) {
      console.warn('Error formatting fecha boda:', fechaBoda, error)
      return 'Fecha no válida'
    }
  }

  const getServicioNombre = (servicio: any) => {
    try {
      if (!servicio) return 'Servicio no especificado'
      
      if (servicio.nombre && typeof servicio.nombre === 'string') {
        return servicio.nombre
      }
      
      if (servicio.tipo && typeof servicio.tipo === 'string') {
        return servicio.tipo.replace(/_/g, ' ')
      }
      
      return 'Servicio no especificado'
    } catch (error) {
      console.warn('Error getting servicio nombre:', servicio, error)
      return 'Servicio no especificado'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona todos tus clientes de bodas</p>
        </div>
        <Link to="/clientes/agregar" className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </Link>
      </div>

      {/* Alertas de coincidencias */}
      {coincidenciasFechas.length > 0 && (
        <div className="alert alert-warning">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <h4 className="font-semibold">¡Fechas coincidentes detectadas!</h4>
              <p className="text-sm mt-1">
                Hay {coincidenciasFechas.length} fecha(s) con múltiples eventos programados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value || '')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value || 'todos')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="potencial">Potencial</option>
            <option value="confirmado">Confirmado</option>
            <option value="en_proceso">En Proceso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={servicioFilter}
            onChange={(e) => setServicioFilter(e.target.value || 'todos')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los servicios</option>
            <option value="fotografia">Fotografía</option>
            <option value="video">Video</option>
            <option value="fotografia_video">Fotografía + Video</option>
            <option value="album">Álbum</option>
            <option value="paquete_completo">Paquete Completo</option>
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>{clientesFiltrados.length} de {clientes.length} clientes</span>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clientesFiltrados.map(cliente => {
          if (!cliente || !cliente._id) return null
          
          return (
            <div key={cliente._id} className={`card ${tieneCoincidenciaFecha(cliente) ? 'border-l-4 border-l-yellow-400' : ''}`}>
              {/* Header del cliente */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {cliente.nombres || 'Nombre no especificado'}
                    {tieneCoincidenciaFecha(cliente) && (
                      <AlertTriangle className="inline-block w-4 h-4 text-yellow-500 ml-2" title="Fecha coincidente" />
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(cliente.estado)}`}>
                      {cliente.estado || 'Sin estado'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getServicioColor(cliente.servicio?.tipo)}`}>
                      {getServicioNombre(cliente.servicio)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/clientes/${cliente._id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Información del evento */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatFechaBoda(cliente.fechaBoda)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{(cliente.venue || 'Venue no especificado')}, {(cliente.ciudad || 'Ciudad no especificada')}</span>
                </div>
                {cliente.telefono && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{cliente.telefono}</span>
                  </div>
                )}
                {cliente.emails && Array.isArray(cliente.emails) && cliente.emails.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{cliente.emails[0] || 'Email no especificado'}</span>
                    {cliente.emails.length > 1 && (
                      <span className="text-xs text-gray-500">+{cliente.emails.length - 1} más</span>
                    )}
                  </div>
                )}
              </div>

              {/* Información de pagos */}
              {cliente.montoTotal && typeof cliente.montoTotal === 'number' && cliente.montoTotal > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">
                        Total: {cliente.divisa === 'EUR' ? '€' : (cliente.divisa || 'EUR')}{cliente.montoTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-medium">
                        Abonado: {cliente.divisa === 'EUR' ? '€' : (cliente.divisa || 'EUR')}{((cliente.montoAbonado || 0)).toLocaleString()}
                      </div>
                      {(cliente.montoTotal - (cliente.montoAbonado || 0)) > 0 && (
                        <div className="text-red-600 text-xs">
                          Pendiente: {cliente.divisa === 'EUR' ? '€' : (cliente.divisa || 'EUR')}{(cliente.montoTotal - (cliente.montoAbonado || 0)).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso de pago */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, ((cliente.montoAbonado || 0) / cliente.montoTotal) * 100))}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas rápidas */}
              {cliente.solicitudesEspeciales && typeof cliente.solicitudesEspeciales === 'string' && cliente.solicitudesEspeciales.trim() && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                  <strong>Solicitudes:</strong> {cliente.solicitudesEspeciales.substring(0, 100)}
                  {cliente.solicitudesEspeciales.length > 100 && '...'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron clientes</p>
          <p className="text-gray-400 mt-2">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  )
}

export default Clientes
