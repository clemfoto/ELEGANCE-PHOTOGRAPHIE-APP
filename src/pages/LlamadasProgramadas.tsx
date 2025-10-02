
import React, { useState } from 'react'
import { 
  Phone, 
  Calendar, 
  Clock, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Save,
  X,
  ExternalLink,
  Settings,
  Link
} from 'lucide-react'
import { useLlamadasProgramadas, LlamadaProgramada } from '../hooks/useLlamadasProgramadas'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const LlamadasProgramadas: React.FC = () => {
  const { 
    llamadas, 
    loading, 
    actualizarLlamada, 
    eliminarLlamada, 
    obtenerProximasLlamadas 
  } = useLlamadasProgramadas()

  const [llamadaEditando, setLlamadaEditando] = useState<string | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<Partial<LlamadaProgramada>>({})
  const [mostrarConfigCalendly, setMostrarConfigCalendly] = useState(false)
  const [urlCalendly, setUrlCalendly] = useState(localStorage.getItem('calendly_url') || 'https://calendly.com/tu-usuario')

  const proximasLlamadas = obtenerProximasLlamadas()

  const guardarConfigCalendly = () => {
    localStorage.setItem('calendly_url', urlCalendly)
    setMostrarConfigCalendly(false)
    toast.success('URL de Calendly guardada exitosamente')
  }

  const obtenerIconoEstado = (estado: string) => {
    switch (estado) {
      case 'programada': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'confirmada': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'completada': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'cancelada': return <XCircle className="h-4 w-4 text-red-500" />
      case 'no_contesto': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-yellow-100 text-yellow-800'
      case 'confirmada': return 'bg-green-100 text-green-800'
      case 'completada': return 'bg-blue-100 text-blue-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      case 'no_contesto': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const iniciarEdicion = (llamada: LlamadaProgramada) => {
    setLlamadaEditando(llamada._id)
    setDatosEdicion({
      clienteNombre: llamada.clienteNombre,
      email: llamada.email,
      telefono: llamada.telefono,
      fechaLlamada: llamada.fechaLlamada,
      duracion: llamada.duracion,
      tipoLlamada: llamada.tipoLlamada,
      estado: llamada.estado,
      notas: llamada.notas
    })
  }

  const guardarEdicion = async () => {
    if (!llamadaEditando) return

    try {
      await actualizarLlamada(llamadaEditando, datosEdicion)
      setLlamadaEditando(null)
      setDatosEdicion({})
      toast.success('Llamada actualizada exitosamente')
    } catch (error) {
      console.error('Error guardando llamada:', error)
      toast.error('Error al guardar la llamada')
    }
  }

  const cancelarEdicion = () => {
    setLlamadaEditando(null)
    setDatosEdicion({})
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Llamadas Programadas
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestiona las llamadas programadas desde Calendly
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setMostrarConfigCalendly(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurar Calendly
              </button>
              
              <a
                href={urlCalendly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Calendly
              </a>
            </div>
          </div>
        </div>

        {/* Modal de configuración de Calendly */}
        {mostrarConfigCalendly && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Link className="mr-2 h-5 w-5" />
                  Configurar URL de Calendly
                </h3>
                <button
                  onClick={() => setMostrarConfigCalendly(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de tu Calendly
                  </label>
                  <input
                    type="url"
                    value={urlCalendly}
                    onChange={(e) => setUrlCalendly(e.target.value)}
                    placeholder="https://calendly.com/tu-usuario"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ingresa la URL completa de tu página de Calendly
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    ¿Cómo encontrar tu URL de Calendly?
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ve a tu cuenta de Calendly</li>
                    <li>• Copia el enlace de tu página de eventos</li>
                    <li>• Ejemplo: https://calendly.com/tu-nombre/consulta</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={guardarConfigCalendly}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Guardar URL
                </button>
                <button
                  onClick={() => setMostrarConfigCalendly(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Próximas llamadas */}
        {proximasLlamadas.length > 0 && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Próximas Llamadas
            </h3>
            <div className="space-y-3">
              {proximasLlamadas.slice(0, 3).map((llamada) => (
                <div key={llamada._id} className="flex items-center justify-between bg-white p-3 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">{llamada.clienteNombre}</p>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(llamada.fechaLlamada), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(llamada.estado)}`}>
                    {llamada.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de llamadas */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {llamadas.map((llamada) => (
              <li key={llamada._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {llamadaEditando === llamada._id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <input
                              type="text"
                              value={datosEdicion.clienteNombre || ''}
                              onChange={(e) => setDatosEdicion(prev => ({ ...prev, clienteNombre: e.target.value }))}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Nombre del cliente"
                            />
                            <input
                              type="email"
                              value={datosEdicion.email || ''}
                              onChange={(e) => setDatosEdicion(prev => ({ ...prev, email: e.target.value }))}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Email"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <input
                              type="tel"
                              value={datosEdicion.telefono || ''}
                              onChange={(e) => setDatosEdicion(prev => ({ ...prev, telefono: e.target.value }))}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Teléfono"
                            />
                            <input
                              type="datetime-local"
                              value={datosEdicion.fechaLlamada ? format(parseISO(datosEdicion.fechaLlamada), "yyyy-MM-dd'T'HH:mm") : ''}
                              onChange={(e) => setDatosEdicion(prev => ({ ...prev, fechaLlamada: new Date(e.target.value).toISOString() }))}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <select
                              value={datosEdicion.estado || ''}
                              onChange={(e) => setDatosEdicion(prev => ({ ...prev, estado: e.target.value as any }))}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="programada">Programada</option>
                              <option value="confirmada">Confirmada</option>
                              <option value="completada">Completada</option>
                              <option value="cancelada">Cancelada</option>
                              <option value="no_contesto">No Contestó</option>
                            </select>
                          </div>
                          
                          <textarea
                            value={datosEdicion.notas || ''}
                            onChange={(e) => setDatosEdicion(prev => ({ ...prev, notas: e.target.value }))}
                            rows={2}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Notas de la llamada"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center">
                            <p className="text-lg font-medium text-gray-900">
                              {llamada.clienteNombre}
                            </p>
                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${obtenerColorEstado(llamada.estado)}`}>
                              {obtenerIconoEstado(llamada.estado)}
                              <span className="ml-1">{llamada.estado}</span>
                            </span>
                          </div>
                          
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                {format(parseISO(llamada.fechaLlamada), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </div>
                              
                              {llamada.duracion && (
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                  {llamada.duracion} minutos
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                {llamada.email}
                              </div>
                              
                              {llamada.telefono && (
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                                  {llamada.telefono}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {llamada.notas && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-600">{llamada.notas}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                      {llamadaEditando === llamada._id ? (
                        <>
                          <button
                            onClick={guardarEdicion}
                            className="p-2 text-green-600 hover:text-green-800"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="p-2 text-gray-600 hover:text-gray-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => iniciarEdicion(llamada)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Estado vacío */}
        {llamadas.length === 0 && (
          <div className="text-center py-12">
            <Phone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay llamadas programadas
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Las llamadas aparecerán aquí cuando los clientes las programen en Calendly
            </p>
            <div className="mt-6">
              <a
                href={urlCalendly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ir a Calendly
              </a>
            </div>
          </div>
        )}

        {/* Información de integración */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estado de Integraciones
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Calendly</p>
                <p className="text-sm text-gray-500">URL configurada: {urlCalendly}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Outlook</p>
                <p className="text-sm text-gray-500">Sincronización activa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LlamadasProgramadas
