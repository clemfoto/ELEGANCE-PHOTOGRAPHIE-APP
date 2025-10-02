
import { useState, useEffect, useCallback } from 'react'
import { useClientes } from './useClientes'
import { parseISO, differenceInDays, isSameDay } from 'date-fns'

export interface AlertaEvento {
  clienteId: string
  nombreCliente: string
  fechaEvento: string
  diasRestantes: number
  tipo: 'evento_proximo' | 'pago_vencido' | 'pago_proximo' | 'recordatorio'
  mensaje: string
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
}

export const useAlertas = () => {
  const { clientes } = useClientes()
  const [alertasActivas, setAlertasActivas] = useState<AlertaEvento[]>([])
  const [notificacionesCelular, setNotificacionesCelular] = useState(false)

  // Verificar soporte para notificaciones push
  const verificarSoporteNotificaciones = useCallback(() => {
    return 'Notification' in window && 'serviceWorker' in navigator
  }, [])

  // Solicitar permisos para notificaciones
  const solicitarPermisoNotificaciones = useCallback(async () => {
    if (!verificarSoporteNotificaciones()) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificacionesCelular(true)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error)
      return false
    }
  },[])

  // Enviar notificación push (solo para celular, sin toast)
  const enviarNotificacionPush = useCallback(async (titulo: string, mensaje: string, icono?: string) => {
    if (!notificacionesCelular || Notification.permission !== 'granted') {
      return
    }

    try {
      const notification = new Notification(titulo, {
        body: mensaje,
        icon: icono || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'evento-alerta',
        requireInteraction: true,
        actions: [
          {
            action: 'ver',
            title: 'Ver Detalles'
          },
          {
            action: 'cerrar',
            title: 'Cerrar'
          }
        ]
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto-cerrar después de 10 segundos
      setTimeout(() => {
        notification.close()
      }, 10000)

    } catch (error) {
      console.error('Error al enviar notificación:', error)
    }
  }, [notificacionesCelular])

  // Generar alertas de eventos próximos (7 días antes)
  const generarAlertasEventos = useCallback(() => {
    const hoy = new Date()
    const alertas: AlertaEvento[] = []

    clientes.forEach(cliente => {
      if (cliente.fechaBoda && cliente.alertasConfiguradas?.alertaSieteDias) {
        const fechaEvento = parseISO(cliente.fechaBoda)
        const diasRestantes = differenceInDays(fechaEvento, hoy)

        // Alerta 7 días antes
        if (diasRestantes === 7) {
          alertas.push({
            clienteId: cliente._id,
            nombreCliente: cliente.nombres,
            fechaEvento: cliente.fechaBoda,
            diasRestantes,
            tipo: 'evento_proximo',
            mensaje: `Evento de ${cliente.nombres} en 7 días - ${cliente.venue}`,
            prioridad: 'alta'
          })
        }

        // Alerta día del evento
        if (diasRestantes === 0) {
          alertas.push({
            clienteId: cliente._id,
            nombreCliente: cliente.nombres,
            fechaEvento: cliente.fechaBoda,
            diasRestantes,
            tipo: 'evento_proximo',
            mensaje: `¡HOY es el evento de ${cliente.nombres}! - ${cliente.venue}`,
            prioridad: 'critica'
          })
        }
      }

      // Alertas de pagos
      if (cliente.detallesPago?.cuotas && cliente.alertasConfiguradas?.alertaPago) {
        cliente.detallesPago.cuotas.forEach(cuota => {
          if (cuota.estado === 'pendiente') {
            const fechaPago = parseISO(cuota.fechaPago)
            const diasRestantes = differenceInDays(fechaPago, hoy)

            // Pago vencido
            if (diasRestantes < 0) {
              alertas.push({
                clienteId: cliente._id,
                nombreCliente: cliente.nombres,
                fechaEvento: cuota.fechaPago,
                diasRestantes,
                tipo: 'pago_vencido',
                mensaje: `Pago vencido de ${cliente.nombres} - €${cuota.monto}`,
                prioridad: 'critica'
              })
            }
            // Pago próximo (3 días antes)
            else if (diasRestantes <= 3 && diasRestantes >= 0) {
              alertas.push({
                clienteId: cliente._id,
                nombreCliente: cliente.nombres,
                fechaEvento: cuota.fechaPago,
                diasRestantes,
                tipo: 'pago_proximo',
                mensaje: `Pago próximo de ${cliente.nombres} en ${diasRestantes} días - €${cuota.monto}`,
                prioridad: diasRestantes === 0 ? 'critica' : 'alta'
              })
            }
          }
        })
      }
    })

    return alertas
  }, [clientes])

  // Procesar alertas (solo push, sin toast)
  const procesarAlertas = useCallback(async () => {
    const nuevasAlertas = generarAlertasEventos()
    
    // Filtrar alertas nuevas que no hayan sido mostradas hoy
    const alertasParaMostrar = nuevasAlertas.filter(alerta => {
      const alertaExistente = alertasActivas.find(a => 
        a.clienteId === alerta.clienteId && 
        a.tipo === alerta.tipo &&
        isSameDay(parseISO(a.fechaEvento), parseISO(alerta.fechaEvento))
      )
      return !alertaExistente
    })

    // Solo enviar notificaciones push (sin toast)
    alertasParaMostrar.forEach(alerta => {
      if (alerta.prioridad === 'critica' && notificacionesCelular) {
        enviarNotificacionPush('🚨 ALERTA CRÍTICA', alerta.mensaje)
      } else if (alerta.prioridad === 'alta' && notificacionesCelular) {
        enviarNotificacionPush('⚠️ Alerta Importante', alerta.mensaje)
      }
    })

    setAlertasActivas(nuevasAlertas)
  }, [generarAlertasEventos, alertasActivas, notificacionesCelular, enviarNotificacionPush])

  // Configurar verificación automática de alertas
  useEffect(() => {
    // Verificar alertas al cargar
    procesarAlertas()

    // Configurar verificación cada 30 minutos
    const interval = setInterval(procesarAlertas, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [procesarAlertas])

  // Verificar permisos de notificación al cargar
  useEffect(() => {
    if (verificarSoporteNotificaciones() && Notification.permission === 'granted') {
      setNotificacionesCelular(true)
    }
  }, [verificarSoporteNotificaciones])

  return {
    alertasActivas,
    notificacionesCelular,
    verificarSoporteNotificaciones,
    solicitarPermisoNotificaciones,
    enviarNotificacionPush,
    procesarAlertas
  }
}
