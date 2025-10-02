
import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useClientes } from '../hooks/useClientes'
import { useServicios } from '../hooks/useServicios'
import ListaInvitados from '../components/ListaInvitados'
import {ArrowLeft, Edit, Calendar, MapPin, Phone, Mail, DollarSign, FileText, Bell, Camera, Clock, AlertTriangle, Users, Save, X, Trash2, Plus} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const ClienteDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getClienteById, updateCliente, deleteCliente, loading } = useClientes()
  const { servicios } = useServicios()

  // Estados para edición
  const [modoEdicion, setModoEdicion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datosEdicion, setDatosEdicion] = useState<any>(null)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const cliente = id ? getClienteById(id) : null

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cliente no encontrado</h2>
        <p className="text-gray-600 mb-6">El cliente que buscas no existe o ha sido eliminado.</p>
        <Link to="/clientes" className="btn-primary">
          Volver a Clientes
        </Link>
      </div>
    )
  }

  // Inicializar datos de edición cuando se activa el modo edición
  const activarModoEdicion = () => {
    setDatosEdicion({
      nombres: cliente.nombres || '',
      emails: cliente.emails || [''],
      telefono: cliente.telefono || '',
      fechaBoda: cliente.fechaBoda ? cliente.fechaBoda.slice(0, 16) : '',
      ciudad: cliente.ciudad || '',
      venue: cliente.venue || '',
      servicio: {
        ...cliente.servicio,
        nombre: cliente.servicio?.nombre || '',
        descripcionPersonalizada: cliente.servicio?.descripcionPersonalizada || ''
      },
      divisa: cliente.divisa || 'EUR',
      formaPago: cliente.formaPago || 'efectivo',
      montoTotal: cliente.montoTotal || 0,
      montoAbonado: cliente.montoAbonado || 0,
      estado: cliente.estado || 'potencial',
      solicitudesEspeciales: cliente.solicitudesEspeciales || '',
      archivoExcel: cliente.archivoExcel || '',
      notas: cliente.notas || '',
      alertasConfiguradas: {
        alertaSieteDias: cliente.alertasConfiguradas?.alertaSieteDias || false,
        alertaPago: cliente.alertasConfiguradas?.alertaPago || false,
        notificacionCelular: cliente.alertasConfiguradas?.notificacionCelular || false
      }
    })
    setModoEdicion(true)
    setError(null)
  }

  const cancelarEdicion = () => {
    setModoEdicion(false)
    setDatosEdicion(null)
    setError(null)
  }

  // Funciones para manejar múltiples emails en edición
  const agregarEmailEdicion = () => {
    setDatosEdicion(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }))
  }

  const eliminarEmailEdicion = (index: number) => {
    if (datosEdicion.emails.length > 1) {
      setDatosEdicion(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index)
      }))
    }
  }

  const actualizarEmailEdicion = (index: number, valor: string) => {
    setDatosEdicion(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? valor : email)
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    try {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked
        if (name.startsWith('alertas.')) {
          const alertKey = name.split('.')[1]
          setDatosEdicion(prev => ({
            ...prev,
            alertasConfiguradas: {
              ...prev.alertasConfiguradas,
              [alertKey]: checked
            }
          }))
        }
      } else if (type === 'number') {
        setDatosEdicion(prev => ({
          ...prev,
          [name]: parseFloat(value) || 0
        }))
      } else if (name.startsWith('servicio.')) {
        const servicioField = name.split('.')[1]
        setDatosEdicion(prev => ({
          ...prev,
          servicio: {
            ...prev.servicio,
            [servicioField]: value
          }
        }))
      } else {
        setDatosEdicion(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } catch (err) {
      console.error('Error updating form data:', err)
      setError('Error al actualizar el formulario')
    }
  }

  const guardarCambios = async () => {
    try {
      setGuardando(true)
      setError(null)

      // Validaciones básicas
      if (!datosEdicion.nombres.trim()) {
        throw new Error('El nombre es requerido')
      }

      // Validar emails
      const emailsValidos = datosEdicion.emails.filter(email => email.trim() && email.includes('@'))
      if (emailsValidos.length === 0) {
        throw new Error('Al menos un email válido es requerido')
      }

      if (!datosEdicion.fechaBoda) {
        throw new Error('La fecha de la boda es requerida')
      }

      if (!datosEdicion.ciudad.trim()) {
        throw new Error('La ciudad es requerida')
      }

      if (!datosEdicion.venue.trim()) {
        throw new Error('El venue es requerido')
      }

      // Preparar datos para actualización
      const datosActualizacion = {
        ...datosEdicion,
        emails: emailsValidos,
        fechaBoda: datosEdicion.fechaBoda + ':00.000Z' // Asegurar formato ISO
      }

      await updateCliente(cliente._id!, datosActualizacion)
      setModoEdicion(false)
      setDatosEdicion(null)
      
      // Mostrar mensaje de éxito
      alert('Cliente actualizado correctamente')
      
    } catch (error: any) {
      console.error('Error al guardar cambios:', error)
      setError(error.message || 'Error al guardar cambios')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminacion = () => {
    setMostrarConfirmacion(true)
  }

  const eliminarCliente = async () => {
    try {
      setEliminando(true)
      await deleteCliente(cliente._id!)
      navigate('/clientes')
    } catch (error: any) {
      console.error('Error al eliminar cliente:', error)
      setError(error.message || 'Error al eliminar cliente')
      setMostrarConfirmacion(false)
    } finally {
      setEliminando(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'potencial': return 'bg-yellow-100 text-yellow-800'
      case 'confirmado': return 'bg-green-100 text-green-800'
      case 'en_proceso': return 'bg-blue-100 text-blue-800'
      case 'completado': return 'bg-gray-100 text-gray-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServicioIcon = (tipo: string) => {
    switch (tipo) {
      case 'fotografia': return <Camera className="w-5 h-5" />
      case 'video': return <FileText className="w-5 h-5" />
      default: return <Camera className="w-5 h-5" />
    }
  }

  const porcentajePagado = cliente.montoTotal ? ((cliente.montoAbonado || 0) / cliente.montoTotal) * 100 : 0
  const montoPendiente = (cliente.montoTotal || 0) - (cliente.montoAbonado || 0)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Modal de confirmación de eliminación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar a <strong>{cliente.nombres}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="btn-secondary"
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                onClick={eliminarCliente}
                disabled={eliminando}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                {eliminando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{eliminando ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clientes')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cliente.nombres}</h1>
            <p className="text-gray-600">Detalles del cliente y evento</p>
          </div>
        </div>
        <div className="flex space-x-3">
          {!modoEdicion ? (
            <>
              <button 
                onClick={activarModoEdicion}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button 
                onClick={confirmarEliminacion}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={cancelarEdicion}
                className="btn-secondary flex items-center space-x-2"
                disabled={guardando}
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
              <button 
                onClick={guardarCambios}
                disabled={guardando}
                className="btn-primary flex items-center space-x-2"
              >
                {guardando ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Información del Cliente</h2>
              {!modoEdicion && (
                <span className={`px-3 py-1 text-sm rounded-full ${getEstadoColor(cliente.estado)}`}>
                  {cliente.estado}
                </span>
              )}
            </div>
            
            {modoEdicion ? (
              <div className="space-y-4">
                {/* Nombres */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres Completos *
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    value={datosEdicion?.nombres || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Múltiples emails */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emails *
                  </label>
                  <div className="space-y-2">
                    {datosEdicion?.emails?.map((email, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => actualizarEmailEdicion(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {datosEdicion.emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarEmailEdicion(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={agregarEmailEdicion}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar otro email</span>
                    </button>
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={datosEdicion?.telefono || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado del Cliente *
                  </label>
                  <select
                    name="estado"
                    value={datosEdicion?.estado || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="potencial">Potencial</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Múltiples emails */}
                {cliente.emails && cliente.emails.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Email{cliente.emails.length > 1 ? 's' : ''}</p>
                      <div className="space-y-1">
                        {cliente.emails.map((email, index) => (
                          <p key={index} className="text-gray-900">{email}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {cliente.telefono && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="text-gray-900">{cliente.telefono}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Información del evento */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles del Evento</h2>
            
            {modoEdicion ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha y Hora de la Boda *
                  </label>
                  <input
                    type="datetime-local"
                    name="fechaBoda"
                    value={datosEdicion?.fechaBoda || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={datosEdicion?.ciudad || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue / Lugar del Evento *
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={datosEdicion?.venue || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    name="servicio.nombre"
                    value={datosEdicion?.servicio?.nombre || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Servicio
                  </label>
                  <textarea
                    name="servicio.descripcionPersonalizada"
                    value={datosEdicion?.servicio?.descripcionPersonalizada || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha y hora</p>
                    <p className="text-lg font-medium text-gray-900">
                      {format(parseISO(cliente.fechaBoda), 'EEEE, dd \'de\' MMMM \'de\' yyyy \'a las\' HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="text-gray-900">{cliente.venue}</p>
                    <p className="text-sm text-gray-500">{cliente.ciudad}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getServicioIcon(cliente.servicio?.tipo || 'fotografia')}
                  <div>
                    <p className="text-sm text-gray-600">Servicio contratado</p>
                    <p className="text-gray-900">{cliente.servicio?.nombre || 'No especificado'}</p>
                    {cliente.servicio?.descripcionPersonalizada && (
                      <p className="text-sm text-gray-500 mt-1">{cliente.servicio.descripcionPersonalizada}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información de pagos */}
          {modoEdicion && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de Pagos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Divisa *
                  </label>
                  <select
                    name="divisa"
                    value={datosEdicion?.divisa || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="MXN">Peso Mexicano (MXN)</option>
                    <option value="USD">Dólar Estadounidense ($)</option>
                    <option value="CAD">Dólar Canadiense (CAD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pago *
                  </label>
                  <select
                    name="formaPago"
                    value={datosEdicion?.formaPago || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="financiado">Financiado</option>
                    <option value="mixto">Mixto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Total ({datosEdicion?.divisa === 'EUR' ? '€' : datosEdicion?.divisa})
                  </label>
                  <input
                    type="number"
                    name="montoTotal"
                    value={datosEdicion?.montoTotal || 0}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Abonado ({datosEdicion?.divisa === 'EUR' ? '€' : datosEdicion?.divisa})
                  </label>
                  <input
                    type="number"
                    name="montoAbonado"
                    value={datosEdicion?.montoAbonado || 0}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Solicitudes especiales */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitudes Especiales</h2>
            
            {modoEdicion ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Solicitudes Especiales
                  </label>
                  <textarea
                    name="solicitudesEspeciales"
                    value={datosEdicion?.solicitudesEspeciales || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Archivo Excel (URL)
                  </label>
                  <input
                    type="url"
                    name="archivoExcel"
                    value={datosEdicion?.archivoExcel || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <>
                {cliente.solicitudesEspeciales && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-800">{cliente.solicitudesEspeciales}</p>
                  </div>
                )}
                
                {cliente.archivoExcel && (
                  <div className="mt-4">
                    <a 
                      href={cliente.archivoExcel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver archivo Excel de solicitudes</span>
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lista de invitados */}
          <div className="card">
            <ListaInvitados 
              clienteId={cliente._id!}
              invitados={cliente.listaInvitados || []}
            />
          </div>

          {/* Notas internas */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notas Internas</h2>
            
            {modoEdicion ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Internas
                </label>
                <textarea
                  name="notas"
                  value={datosEdicion?.notas || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas internas para el equipo..."
                />
              </div>
            ) : (
              <>
                {cliente.notas ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800">{cliente.notas}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No hay notas internas</p>
                )}
              </>
            )}
          </div>

          {/* Configuración de alertas en modo edición */}
          {modoEdicion && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Alertas</h2>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alertas.alertaSieteDias"
                    checked={datosEdicion?.alertasConfiguradas?.alertaSieteDias || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Alerta 7 días antes del evento
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alertas.alertaPago"
                    checked={datosEdicion?.alertasConfiguradas?.alertaPago || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Alertas de pagos pendientes
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="alertas.notificacionCelular"
                    checked={datosEdicion?.alertasConfiguradas?.notificacionCelular || false}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Enviar notificaciones al celular
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información de pagos */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pagos</h3>
            
            {cliente.montoTotal ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {cliente.divisa === 'EUR' ? '€' : cliente.divisa}{(cliente.montoAbonado || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    de {cliente.divisa === 'EUR' ? '€' : cliente.divisa}{cliente.montoTotal.toLocaleString()} total
                  </div>
                </div>

                {/* Barra de progreso */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso de pago</span>
                    <span>{Math.round(porcentajePagado)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${porcentajePagado}%` }}
                    ></div>
                  </div>
                </div>

                {/* Detalles de pago */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Forma de pago:</span>
                    <span className="text-gray-900 capitalize">{cliente.formaPago}</span>
                  </div>
                  
                  {montoPendiente > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pendiente:</span>
                      <span className="text-red-600 font-medium">
                        {cliente.divisa === 'EUR' ? '€' : cliente.divisa}{montoPendiente.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {cliente.proximoPago && montoPendiente > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Próximo pago</span>
                      </div>
                      <div className="text-sm text-yellow-700">
                        {cliente.divisa === 'EUR' ? '€' : cliente.divisa}{cliente.proximoPago.monto.toLocaleString()} - {cliente.proximoPago.metodoPago}
                      </div>
                      <div className="text-xs text-yellow-600">
                        Vence: {format(parseISO(cliente.proximoPago.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay información de pagos</p>
            )}
          </div>

          {/* Configuración de alertas */}
          {!modoEdicion && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Configuradas</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Alerta 7 días antes</span>
                  <div className={`w-3 h-3 rounded-full ${
                    cliente.alertasConfiguradas?.alertaSieteDias ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Alertas de pago</span>
                  <div className={`w-3 h-3 rounded-full ${
                    cliente.alertasConfiguradas?.alertaPago ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notificación celular</span>
                  <div className={`w-3 h-3 rounded-full ${
                    cliente.alertasConfiguradas?.notificacionCelular ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                </div>
              </div>
            </div>
          )}

          {/* Recordatorios */}
          {cliente.recordatorios && cliente.recordatorios.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recordatorios</h3>
              
              <div className="space-y-3">
                {cliente.recordatorios.map((recordatorio, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">{recordatorio.tipo}</span>
                    </div>
                    <p className="text-sm text-blue-700">{recordatorio.mensaje}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {format(parseISO(recordatorio.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información del sistema */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
            
            <div className="space-y-2 text-sm">
              {cliente.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Creado:</span>
                  <span className="text-gray-900">
                    {format(parseISO(cliente.createdAt), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              )}
              
              {cliente.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Actualizado:</span>
                  <span className="text-gray-900">
                    {format(parseISO(cliente.updatedAt), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClienteDetalle
