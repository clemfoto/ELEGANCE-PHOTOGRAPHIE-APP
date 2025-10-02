
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientes, Cliente, Divisa } from '../hooks/useClientes'
import { useServicios } from '../hooks/useServicios'
import {ArrowLeft, Upload, Save, AlertCircle, Plus, X, Mail} from 'lucide-react'

const AgregarCliente: React.FC = () => {
  const navigate = useNavigate()
  const { addCliente } = useClientes()
  const { servicios } = useServicios()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Omit<Cliente, '_id' | 'createdAt' | 'updatedAt'>>({
    nombres: '',
    emails: [''], // Array de emails
    telefono: '',
    fechaBoda: '',
    ciudad: '',
    venue: '',
    servicio: {
      tipo: 'fotografia',
      nombre: '',
      descripcionPersonalizada: ''
    },
    divisa: 'EUR', // Divisa por defecto
    formaPago: 'efectivo',
    montoTotal: 0,
    montoAbonado: 0,
    estado: 'potencial',
    solicitudesEspeciales: '',
    archivoExcel: '',
    notas: '',
    listaInvitados: [], // Inicializar lista vacía
    alertasConfiguradas: {
      alertaSieteDias: true,
      alertaPago: true,
      notificacionCelular: false
    }
  })

  const [servicioSeleccionado, setServicioSeleccionado] = useState<'predefinido' | 'personalizado'>('predefinido')

  // Funciones para manejar múltiples emails
  const agregarEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, '']
    }))
  }

  const eliminarEmail = (index: number) => {
    if (formData.emails.length > 1) {
      setFormData(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index)
      }))
    }
  }

  const actualizarEmail = (index: number, valor: string) => {
    setFormData(prev => ({
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
          setFormData(prev => ({
            ...prev,
            alertasConfiguradas: {
              ...prev.alertasConfiguradas!,
              [alertKey]: checked
            }
          }))
        }
      } else if (type === 'number') {
        setFormData(prev => ({
          ...prev,
          [name]: parseFloat(value) || 0
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } catch (err) {
      console.error('Error updating form data:', err)
      setError('Error al actualizar el formulario')
    }
  }

  const handleServicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      const servicioId = e.target.value
      
      if (servicioId === 'personalizado') {
        setServicioSeleccionado('personalizado')
        setFormData(prev => ({
          ...prev,
          servicio: {
            tipo: 'personalizado',
            nombre: '',
            descripcionPersonalizada: ''
          }
        }))
      } else if (servicioId) {
        const servicio = servicios.find(s => s._id === servicioId)
        if (servicio) {
          setServicioSeleccionado('predefinido')
          setFormData(prev => ({
            ...prev,
            servicio: {
              tipo: servicio.categoria as any,
              servicioId: servicio._id,
              nombre: servicio.nombre,
              precio: servicio.precio
            }
          }))
        }
      }
    } catch (err) {
      console.error('Error selecting service:', err)
      setError('Error al seleccionar el servicio')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      
      // Validaciones básicas
      if (!formData.nombres.trim()) {
        throw new Error('El nombre es requerido')
      }
      
      // Validar que al menos un email sea válido
      const emailsValidos = formData.emails.filter(email => email.trim() && email.includes('@'))
      if (emailsValidos.length === 0) {
        throw new Error('Al menos un email válido es requerido')
      }
      
      if (!formData.fechaBoda) {
        throw new Error('La fecha de la boda es requerida')
      }
      
      if (!formData.ciudad.trim()) {
        throw new Error('La ciudad es requerida')
      }
      
      if (!formData.venue.trim()) {
        throw new Error('El venue es requerido')
      }

      if (!formData.servicio.nombre.trim()) {
        throw new Error('Debe seleccionar o especificar un servicio')
      }

      // Preparar datos para envío
      const clienteData = {
        ...formData,
        emails: emailsValidos, // Solo emails válidos
        listaInvitados: [], // Inicializar con lista vacía
        proximoPago: formData.montoTotal && formData.montoAbonado && formData.montoTotal > formData.montoAbonado ? {
          monto: formData.montoTotal - formData.montoAbonado,
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          metodoPago: formData.formaPago
        } : undefined
      }
      
      await addCliente(clienteData)
      navigate('/clientes')
    } catch (error: any) {
      console.error('Error al agregar cliente:', error)
      setError(error.message || 'Error al agregar cliente. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clientes')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-4 btn-primary"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/clientes')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agregar Nuevo Cliente</h1>
          <p className="text-gray-600">Completa la información del cliente y evento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica del cliente */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Cliente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombres Completos *
              </label>
              <input
                type="text"
                name="nombres"
                value={formData.nombres}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: María González y Carlos Rodríguez"
              />
            </div>

            {/* Múltiples emails */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emails *
              </label>
              <div className="space-y-2">
                {formData.emails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => actualizarEmail(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="cliente@email.com"
                    />
                    {formData.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarEmail(index)}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={agregarEmail}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar otro email</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+34 612 345 678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del Cliente *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                required
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
        </div>

        {/* Información del evento */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Evento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de la Boda *
              </label>
              <input
                type="datetime-local"
                name="fechaBoda"
                value={formData.fechaBoda ? formData.fechaBoda.slice(0, 16) : ''}
                onChange={handleInputChange}
                required
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
                value={formData.ciudad}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Madrid"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue / Lugar del Evento *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Palacio de la Magdalena"
              />
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Servicios</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Servicio *
              </label>
              <select
                onChange={handleServicioChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona un servicio</option>
                {servicios?.map(servicio => (
                  <option key={servicio._id} value={servicio._id}>
                    {servicio.nombre} - {servicio.precio}€
                  </option>
                ))}
                <option value="personalizado">Servicio Personalizado</option>
              </select>
            </div>

            {servicioSeleccionado === 'personalizado' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Servicio Personalizado *
                  </label>
                  <input
                    type="text"
                    value={formData.servicio.nombre}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      servicio: { ...prev.servicio, nombre: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Paquete Premium Personalizado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Servicio
                  </label>
                  <textarea
                    value={formData.servicio.descripcionPersonalizada || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      servicio: { ...prev.servicio, descripcionPersonalizada: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe los detalles del servicio personalizado..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagos y divisa */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pagos y Divisa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Divisa *
              </label>
              <select
                name="divisa"
                value={formData.divisa}
                onChange={handleInputChange}
                required
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
                value={formData.formaPago}
                onChange={handleInputChange}
                required
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
                Monto Total ({formData.divisa === 'EUR' ? '€' : formData.divisa})
              </label>
              <input
                type="number"
                name="montoTotal"
                value={formData.montoTotal}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Abonado ({formData.divisa === 'EUR' ? '€' : formData.divisa})
              </label>
              <input
                type="number"
                name="montoAbonado"
                value={formData.montoAbonado}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Solicitudes especiales y archivos */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitudes Especiales</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solicitudes Especiales
              </label>
              <textarea
                name="solicitudesEspeciales"
                value={formData.solicitudesEspeciales}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe las solicitudes especiales del cliente..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo Excel (URL)
              </label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  name="archivoExcel"
                  value={formData.archivoExcel}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://docs.google.com/spreadsheets/..."
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Internas
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notas internas para el equipo..."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Después de crear el cliente, podrás agregar una lista de invitados en esta sección
              </p>
            </div>
          </div>
        </div>

        {/* Configuración de alertas */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Alertas</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="alertas.alertaSieteDias"
                checked={formData.alertasConfiguradas?.alertaSieteDias || false}
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
                checked={formData.alertasConfiguradas?.alertaPago || false}
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
                checked={formData.alertasConfiguradas?.notificacionCelular || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Enviar notificaciones al celular
              </label>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/clientes')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Guardando...' : 'Guardar Cliente'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default AgregarCliente
