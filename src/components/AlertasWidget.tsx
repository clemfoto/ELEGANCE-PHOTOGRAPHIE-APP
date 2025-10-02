
import React, { useState, useEffect } from 'react'
import { useClientes } from '../hooks/useClientes'
import { useRecordatorios } from '../hooks/useRecordatorios'
import {Bell, Calendar, DollarSign, AlertTriangle, Volume2} from 'lucide-react'
import { isValidDate, safeFormatDate } from '../utils/dateUtils'

const AlertasWidget: React.FC = () => {
  const { clientes } = useClientes()
  const { recordatorios } = useRecordatorios()
  const [audioEnabled, setAudioEnabled] = useState(false)

  // Reproducir sonido de alerta
  const playAlertSound = () => {
    if (audioEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Tienes una nueva alerta')
      utterance.lang = 'es-ES'
      utterance.volume = 0.5
      speechSynthesis.speak(utterance)
    }
  }

  // Alertas 7 días antes del evento
  const getAlertasProximosEventos = () => {
    const hoy = new Date()
    const fechaLimite = new Date()
    fechaLimite.setDate(hoy.getDate() + 7)

    return clientes.filter(cliente => {
      if (!isValidDate(cliente.fechaBoda)) return false
      
      try {
        const fechaBoda = new Date(cliente.fechaBoda)
        const diasRestantes = Math.ceil((fechaBoda.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        return diasRestantes === 7 && cliente.alertasConfiguradas?.alertaSieteDias !== false
      } catch (error) {
        console.warn('Error calculando días restantes:', cliente.nombres)
        return false
      }
    })
  }

  // Alertas de pagos vencidos
  const getAlertasPagosVencidos = () => {
    const hoy = new Date()
    const alertasPagos: Array<{ cliente: any, cuota: any }> = []

    clientes.forEach(cliente => {
      if (cliente.detallesPago?.cuotas && cliente.alertasConfiguradas?.alertaPago !== false) {
        cliente.detallesPago.cuotas.forEach(cuota => {
          if (cuota.estado === 'pendiente' && isValidDate(cuota.fechaPago)) {
            try {
              const fechaPago = new Date(cuota.fechaPago)
              if (fechaPago < hoy) {
                alertasPagos.push({ cliente, cuota })
              }
            } catch (error) {
              console.warn('Error validando fecha de pago:', cliente.nombres)
            }
          }
        })
      }
    })

    return alertasPagos
  }

  // Recordatorios de hoy
  const getRecordatoriosHoy = () => {
    const hoy = new Date().toISOString().split('T')[0]
    
    return recordatorios.filter(recordatorio => {
      if (!isValidDate(recordatorio.fecha)) return false
      
      try {
        const fechaRecordatorio = recordatorio.fecha.split('T')[0]
        return fechaRecordatorio === hoy
      } catch (error) {
        console.warn('Error validando recordatorio:', recordatorio.mensaje)
        return false
      }
    })
  }

  const alertasEventos = getAlertasProximosEventos()
  const alertasPagos = getAlertasPagosVencidos()
  const recordatoriosHoy = getRecordatoriosHoy()

  const totalAlertas = alertasEventos.length + alertasPagos.length + recordatoriosHoy.length

  // Reproducir sonido cuando hay nuevas alertas
  useEffect(() => {
    if (totalAlertas > 0 && audioEnabled) {
      playAlertSound()
    }
  }, [totalAlertas, audioEnabled])

  // Solicitar permisos de notificación
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Enviar notificación push cuando hay alertas críticas
  useEffect(() => {
    if (alertasPagos.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerta de Pagos Vencidos', {
        body: `Tienes ${alertasPagos.length} pago(s) vencido(s)`,
        icon: '/favicon.ico'
      })
    }
  }, [alertasPagos.length])

  if (totalAlertas === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="text-green-600 mr-2" size={20} />
            <span className="text-green-800 font-medium">No hay alertas pendientes</span>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full transition-colors ${
              audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}
            title={audioEnabled ? 'Desactivar audio' : 'Activar audio'}
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-2" size={20} />
            <h3 className="text-lg font-semibold text-red-800">
              Alertas Activas ({totalAlertas})
            </h3>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full transition-colors ${
              audioEnabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
            }`}
            title={audioEnabled ? 'Desactivar audio' : 'Activar audio'}
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Alertas de eventos próximos (7 días) */}
        {alertasEventos.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <Calendar className="text-yellow-600 mr-2 mt-0.5" size={18} />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">
                  Eventos en 7 días ({alertasEventos.length})
                </h4>
                <div className="space-y-1">
                  {alertasEventos.map(cliente => (
                    <div key={cliente._id} className="text-sm text-yellow-700">
                      <strong>{cliente.nombres}</strong> - {safeFormatDate(cliente.fechaBoda)}
                      <br />
                      <span className="text-xs">{cliente.venue}, {cliente.ciudad}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alertas de pagos vencidos */}
        {alertasPagos.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <DollarSign className="text-red-600 mr-2 mt-0.5" size={18} />
              <div>
                <h4 className="font-medium text-red-800 mb-2">
                  Pagos Vencidos ({alertasPagos.length})
                </h4>
                <div className="space-y-1">
                  {alertasPagos.slice(0, 3).map(({ cliente, cuota }, index) => (
                    <div key={`${cliente._id}-${index}`} className="text-sm text-red-700">
                      <strong>{cliente.nombres}</strong> - ${cuota.monto?.toLocaleString()}
                      <br />
                      <span className="text-xs">
                        Vencido: {safeFormatDate(cuota.fechaPago)} - {cuota.concepto}
                      </span>
                    </div>
                  ))}
                  {alertasPagos.length > 3 && (
                    <div className="text-xs text-red-600 font-medium">
                      +{alertasPagos.length - 3} más...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recordatorios de hoy */}
        {recordatoriosHoy.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Bell className="text-blue-600 mr-2 mt-0.5" size={18} />
              <div>
                <h4 className="font-medium text-blue-800 mb-2">
                  Recordatorios de Hoy ({recordatoriosHoy.length})
                </h4>
                <div className="space-y-1">
                  {recordatoriosHoy.map(recordatorio => (
                    <div key={recordatorio._id} className="text-sm text-blue-700">
                      <strong>{recordatorio.tipo}</strong>
                      <br />
                      <span className="text-xs">{recordatorio.mensaje}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertasWidget
