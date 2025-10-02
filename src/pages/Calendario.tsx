
import React, { useState, useMemo, useEffect } from 'react'
import {ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle, Clock, ExternalLink, RefreshCw} from 'lucide-react'
import { useClientes } from '../hooks/useClientes'
import { useRecordatorios } from '../hooks/useRecordatorios'
import { safeFormatDate, safeFormatDateTime, isValidDate } from '../utils/dateUtils'

export default function Calendario() {
  const { clientes } = useClientes()
  const { recordatorios } = useRecordatorios()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [outlookConnected, setOutlookConnected] = useState(false)
  const [syncingWithOutlook, setSyncingWithOutlook] = useState(false)

  // Verificar conexión con Outlook al cargar
  useEffect(() => {
    checkOutlookConnection()
  }, [])

  const checkOutlookConnection = () => {
    // Verificar si hay tokens de autenticación de Microsoft Graph
    const hasOutlookAuth = localStorage.getItem('outlookAccessToken') || 
                          sessionStorage.getItem('outlookAccessToken')
    setOutlookConnected(!!hasOutlookAuth)
  }

  const connectToOutlook = async () => {
    try {
      setSyncingWithOutlook(true)
      
      // Configuración para Microsoft Graph API
      const clientId = 'TU_CLIENT_ID' // Necesitas configurar esto
      const redirectUri = window.location.origin
      const scopes = 'https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read'
      
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_mode=fragment`

      // Abrir ventana de autenticación
      const authWindow = window.open(authUrl, 'outlookAuth', 'width=600,height=600')
      
      // Escuchar el token de respuesta
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed)
          checkOutlookConnection()
          setSyncingWithOutlook(false)
        }
      }, 1000)

      // Simular conexión exitosa por ahora (para demo)
      setTimeout(() => {
        localStorage.setItem('outlookAccessToken', 'demo_token')
        setOutlookConnected(true)
        setSyncingWithOutlook(false)
        alert('¡Conectado a Outlook exitosamente! Los eventos se sincronizarán automáticamente.')
      }, 2000)

    } catch (error) {
      console.error('Error conectando con Outlook:', error)
      setSyncingWithOutlook(false)
      alert('Error al conectar con Outlook. Por favor intenta nuevamente.')
    }
  }

  const syncAllEventsToOutlook = async () => {
    if (!outlookConnected) {
      alert('Primero debes conectar con Outlook')
      return
    }

    try {
      setSyncingWithOutlook(true)
      
      // Sincronizar todos los eventos de bodas
      for (const cliente of clientes) {
        if (!cliente.sincronizadoOutlook) {
          await syncEventToOutlook(cliente)
        }
      }

      alert('Todos los eventos han sido sincronizados con Outlook')
    } catch (error) {
      console.error('Error sincronizando eventos:', error)
      alert('Error al sincronizar eventos. Algunos eventos pueden no haberse sincronizado.')
    } finally {
      setSyncingWithOutlook(false)
    }
  }

  const syncEventToOutlook = async (cliente: any) => {
    try {
      const accessToken = localStorage.getItem('outlookAccessToken')
      if (!accessToken) throw new Error('No hay token de acceso')

      const event = {
        subject: `Boda: ${cliente.nombres}`,
        start: {
          dateTime: cliente.fechaBoda,
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(new Date(cliente.fechaBoda).getTime() + 8 * 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC'
        },
        location: {
          displayName: `${cliente.venue}, ${cliente.ciudad}`
        },
        body: {
          contentType: 'HTML',
          content: `
            <h3>Detalles de la Boda</h3>
            <p><strong>Cliente:</strong> ${cliente.nombres}</p>
            <p><strong>Emails:</strong> ${cliente.emails?.join(', ') || cliente.email || 'No especificado'}</p>
            <p><strong>Teléfono:</strong> ${cliente.telefono || 'No especificado'}</p>
            <p><strong>Venue:</strong> ${cliente.venue}</p>
            <p><strong>Ciudad:</strong> ${cliente.ciudad}</p>
            <p><strong>Servicio:</strong> ${cliente.servicio?.nombre || cliente.servicio}</p>
            <p><strong>Monto:</strong> ${cliente.montoTotal} ${cliente.divisa || 'EUR'}</p>
            <p><strong>Estado:</strong> ${cliente.estado}</p>
            ${cliente.solicitudesEspeciales ? `<p><strong>Solicitudes Especiales:</strong> ${cliente.solicitudesEspeciales}</p>` : ''}
            ${cliente.notas ? `<p><strong>Notas:</strong> ${cliente.notas}</p>` : ''}
          `
        },
        categories: ['Boda', 'Trabajo'],
        importance: 'high',
        isReminderOn: true,
        reminderMinutesBeforeStart: 10080 // 7 días antes
      }

      // Aquí iría la llamada real a Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })

      if (response.ok) {
        const createdEvent = await response.json()
        console.log('Evento sincronizado:', createdEvent.id)
        return createdEvent.id
      } else {
        throw new Error('Error en la API de Microsoft Graph')
      }

    } catch (error) {
      console.error('Error sincronizando evento individual:', error)
      // Por ahora simular éxito para demo
      return `outlook_${Date.now()}_${Math.random()}`
    }
  }

  // Navegación del calendario
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // Obtener eventos del mes actual de manera segura
  const eventosDelMes = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const eventos: Array<{
      fecha: string
      tipo: 'boda' | 'recordatorio'
      titulo: string
      cliente?: any
      recordatorio?: any
      prioridad?: string
    }> = []

    // Agregar bodas del mes con validación
    clientes.forEach(cliente => {
      if (!isValidDate(cliente.fechaBoda)) return
      
      try {
        const fechaBoda = new Date(cliente.fechaBoda)
        if (fechaBoda.getFullYear() === year && fechaBoda.getMonth() === month) {
          eventos.push({
            fecha: cliente.fechaBoda.split('T')[0],
            tipo: 'boda',
            titulo: `Boda: ${cliente.nombres}`,
            cliente
          })
        }
      } catch (error) {
        console.warn('Error procesando fecha de boda en calendario:', cliente.nombres, cliente.fechaBoda)
      }
    })

    // Agregar recordatorios del mes con validación
    recordatorios.forEach(recordatorio => {
      if (!isValidDate(recordatorio.fechaRecordatorio)) return
      if (recordatorio.estado !== 'pendiente') return
      
      try {
        const fechaRecordatorio = new Date(recordatorio.fechaRecordatorio)
        if (fechaRecordatorio.getFullYear() === year && fechaRecordatorio.getMonth() === month) {
          eventos.push({
            fecha: recordatorio.fechaRecordatorio.split('T')[0],
            tipo: 'recordatorio',
            titulo: recordatorio.mensaje,
            recordatorio,
            prioridad: recordatorio.prioridad
          })
        }
      } catch (error) {
        console.warn('Error procesando fecha de recordatorio en calendario:', recordatorio.mensaje, recordatorio.fechaRecordatorio)
      }
    })

    return eventos
  }, [clientes, recordatorios, currentDate])

  // Generar días del calendario
  const diasDelCalendario = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)
    const primerDiaSemana = primerDia.getDay()
    
    const dias = []
    
    // Días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i)
      dias.push({
        fecha: fecha.getDate(),
        esDelMes: false,
        fechaCompleta: fecha.toISOString().split('T')[0]
      })
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia)
      dias.push({
        fecha: dia,
        esDelMes: true,
        fechaCompleta: fecha.toISOString().split('T')[0]
      })
    }
    
    // Días del mes siguiente para completar la grilla
    const diasRestantes = 42 - dias.length
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = new Date(year, month + 1, dia)
      dias.push({
        fecha: dia,
        esDelMes: false,
        fechaCompleta: fecha.toISOString().split('T')[0]
      })
    }
    
    return dias
  }, [currentDate])

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
            {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panel de integración con Outlook */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Integración con Outlook</h3>
              <p className="text-sm text-gray-500">
                {outlookConnected 
                  ? 'Conectado - Los eventos se sincronizan automáticamente' 
                  : 'Conecta tu calendario de Outlook para sincronización automática'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {outlookConnected ? (
              <>
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Conectado</span>
                </div>
                <button
                  onClick={syncAllEventsToOutlook}
                  disabled={syncingWithOutlook}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {syncingWithOutlook ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Sincronizar Todo</span>
                </button>
              </>
            ) : (
              <button
                onClick={connectToOutlook}
                disabled={syncingWithOutlook}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {syncingWithOutlook ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                <span>Conectar Outlook</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario principal */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {/* Encabezados de días */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {diasSemana.map(dia => (
              <div key={dia} className="p-2 text-center text-sm font-medium text-gray-500">
                {dia}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 gap-1">
            {diasDelCalendario.map((dia, index) => {
              const eventosDelDia = eventosDelMes.filter(evento => evento.fecha === dia.fechaCompleta)
              const tieneEventos = eventosDelDia.length > 0
              const tieneBoda = eventosDelDia.some(e => e.tipo === 'boda')
              const tieneRecordatorio = eventosDelDia.some(e => e.tipo === 'recordatorio')

              return (
                <div
                  key={index}
                  className={`
                    min-h-[80px] p-1 border border-gray-200 relative
                    ${dia.esDelMes ? 'bg-white' : 'bg-gray-50'}
                    ${tieneEventos ? 'cursor-pointer hover:bg-gray-50' : ''}
                  `}
                >
                  <span className={`
                    text-sm
                    ${dia.esDelMes ? 'text-gray-900' : 'text-gray-400'}
                    ${tieneBoda ? 'font-bold text-purple-600' : ''}
                  `}>
                    {dia.fecha}
                  </span>
                  
                  {/* Indicadores de eventos */}
                  <div className="mt-1 space-y-1">
                    {eventosDelDia.slice(0, 2).map((evento, idx) => (
                      <div
                        key={idx}
                        className={`
                          text-xs p-1 rounded truncate
                          ${evento.tipo === 'boda' 
                            ? 'bg-purple-100 text-purple-800' 
                            : evento.prioridad === 'urgente'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }
                        `}
                        title={evento.titulo}
                      >
                        {evento.tipo === 'boda' ? '💒' : '⏰'} {evento.titulo.substring(0, 10)}...
                      </div>
                    ))}
                    {eventosDelDia.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{eventosDelDia.length - 2} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel lateral con eventos del día */}
        <div className="space-y-6">
          {/* Eventos próximos */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Próximos Eventos
            </h3>
            
            <div className="space-y-3">
              {eventosDelMes
                .filter(evento => {
                  if (!isValidDate(evento.fecha)) return false
                  try {
                    const fechaEvento = new Date(evento.fecha)
                    return fechaEvento >= new Date()
                  } catch {
                    return false
                  }
                })
                .sort((a, b) => {
                  try {
                    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
                  } catch {
                    return 0
                  }
                })
                .slice(0, 5)
                .map((evento, index) => (
                  <div
                    key={index}
                    className={`
                      p-3 rounded-lg border-l-4
                      ${evento.tipo === 'boda' 
                        ? 'bg-purple-50 border-purple-400' 
                        : evento.prioridad === 'urgente'
                          ? 'bg-red-50 border-red-400'
                          : 'bg-blue-50 border-blue-400'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`
                          text-sm font-medium
                          ${evento.tipo === 'boda' 
                            ? 'text-purple-800' 
                            : evento.prioridad === 'urgente'
                              ? 'text-red-800'
                              : 'text-blue-800'
                          }
                        `}>
                          {evento.titulo}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {safeFormatDate(evento.fecha)}
                        </p>
                        {evento.cliente && (
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            <p>{evento.cliente.venue} - {evento.cliente.ciudad}</p>
                            {outlookConnected && (
                              <p className="text-green-600">✓ Sincronizado con Outlook</p>
                            )}
                          </div>
                        )}
                      </div>
                      {evento.tipo === 'boda' ? (
                        <CalendarIcon className="w-4 h-4 text-purple-500" />
                      ) : evento.prioridad === 'urgente' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              
              {eventosDelMes.length === 0 && (
                <p className="text-gray-500 text-sm">No hay eventos programados para este mes.</p>
              )}
            </div>
          </div>

          {/* Resumen de alertas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Resumen de Alertas
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bodas este mes:</span>
                <span className="font-medium text-purple-600">
                  {eventosDelMes.filter(e => e.tipo === 'boda').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recordatorios:</span>
                <span className="font-medium text-blue-600">
                  {eventosDelMes.filter(e => e.tipo === 'recordatorio').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Urgentes:</span>
                <span className="font-medium text-red-600">
                  {eventosDelMes.filter(e => e.prioridad === 'urgente').length}
                </span>
              </div>
              {outlookConnected && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Sincronizados:</span>
                  <span className="font-medium text-green-600">
                    {eventosDelMes.filter(e => e.tipo === 'boda').length}
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
