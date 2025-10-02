
import { useState, useEffect, useCallback } from 'react'
import { lumi } from '../lib/lumi'

export interface LlamadaProgramada {
  _id: string
  clienteNombre: string
  email: string
  telefono?: string
  fechaLlamada: string
  duracion?: number
  tipoLlamada: 'consulta_inicial' | 'seguimiento' | 'revision_propuesta' | 'coordinacion'
  estado: 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_contesto'
  notas?: string
  calendlyEventId?: string
  outlookEventId?: string
  recordatorioEnviado?: boolean
  createdAt?: string
  updatedAt?: string
}

export const useLlamadasProgramadas = () => {
  const [llamadas, setLlamadas] = useState<LlamadaProgramada[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLlamadas = useCallback(async () => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.llamadas_programadas.list()
      setLlamadas(list || [])
    } catch (error: any) {
      console.error('Error al cargar llamadas:', error)
      setLlamadas([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Integración con Calendly
  const configurarWebhookCalendly = async () => {
    try {
      // Configurar webhook de Calendly para recibir eventos
      const webhookUrl = `${window.location.origin}/api/calendly-webhook`
      
      // En producción, esto se configuraría en el backend
      console.log('Configurando webhook de Calendly:', webhookUrl)
      
      return true
    } catch (error) {
      console.error('Error configurando webhook Calendly:', error)
      return false
    }
  }

  // Procesar evento de Calendly
  const procesarEventoCalendly = async (eventoCalendly: any) => {
    try {
      const nuevaLlamada: Omit<LlamadaProgramada, '_id'> = {
        clienteNombre: eventoCalendly.invitee.name,
        email: eventoCalendly.invitee.email,
        telefono: eventoCalendly.invitee.phone || '',
        fechaLlamada: eventoCalendly.event.start_time,
        duracion: eventoCalendly.event.duration,
        tipoLlamada: 'consulta_inicial',
        estado: 'programada',
        notas: `Llamada programada desde Calendly - ${eventoCalendly.event.event_type.name}`,
        calendlyEventId: eventoCalendly.event.uuid,
        recordatorioEnviado: false
      }

      const llamadaCreada = await crearLlamada(nuevaLlamada)
      
      // Crear evento en Outlook automáticamente
      await sincronizarConOutlook(llamadaCreada)
      
      return llamadaCreada
    } catch (error) {
      console.error('Error procesando evento Calendly:', error)
      throw error
    }
  }

  // Sincronización con Outlook
  const sincronizarConOutlook = async (llamada: LlamadaProgramada) => {
    try {
      // Integración con Microsoft Graph API
      const eventoOutlook = {
        subject: `Llamada con ${llamada.clienteNombre}`,
        start: {
          dateTime: llamada.fechaLlamada,
          timeZone: 'Europe/Madrid'
        },
        end: {
          dateTime: new Date(new Date(llamada.fechaLlamada).getTime() + (llamada.duracion || 30) * 60000).toISOString(),
          timeZone: 'Europe/Madrid'
        },
        attendees: [
          {
            emailAddress: {
              address: llamada.email,
              name: llamada.clienteNombre
            }
          }
        ],
        body: {
          contentType: 'HTML',
          content: `
            <p>Llamada programada con ${llamada.clienteNombre}</p>
            <p><strong>Tipo:</strong> ${llamada.tipoLlamada}</p>
            <p><strong>Teléfono:</strong> ${llamada.telefono || 'No proporcionado'}</p>
            <p><strong>Notas:</strong> ${llamada.notas || 'Sin notas adicionales'}</p>
          `
        }
      }

      // En producción, esto se haría a través del backend con autenticación OAuth
      console.log('Creando evento en Outlook:', eventoOutlook)
      
      // Simular ID de Outlook
      const outlookEventId = `OUTLOOK_${Date.now()}`
      
      // Actualizar llamada con ID de Outlook
      await actualizarLlamada(llamada._id, { outlookEventId })
      
      return outlookEventId
    } catch (error) {
      console.error('Error sincronizando con Outlook:', error)
      throw error
    }
  }

  const crearLlamada = async (llamadaData: Omit<LlamadaProgramada, '_id'>) => {
    try {
      const nuevaLlamada = await lumi.entities.llamadas_programadas.create({
        ...llamadaData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      await fetchLlamadas()
      return nuevaLlamada
    } catch (error: any) {
      console.error('Error al crear llamada:', error)
      throw error
    }
  }

  const actualizarLlamada = async (llamadaId: string, updates: Partial<LlamadaProgramada>) => {
    if (typeof llamadaId !== 'string') {
      throw new Error('ID de llamada debe ser un string')
    }

    try {
      const llamadaActualizada = await lumi.entities.llamadas_programadas.update(llamadaId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      await fetchLlamadas()
      return llamadaActualizada
    } catch (error: any) {
      console.error('Error al actualizar llamada:', error)
      throw error
    }
  }

  const eliminarLlamada = async (llamadaId: string) => {
    if (typeof llamadaId !== 'string' || llamadaId === '[object Object]') {
      throw new Error('ID de llamada inválido')
    }

    try {
      await lumi.entities.llamadas_programadas.delete(llamadaId)
      await fetchLlamadas()
    } catch (error: any) {
      console.error('Error al eliminar llamada:', error)
      throw error
    }
  }

  const obtenerProximasLlamadas = () => {
    const ahora = new Date()
    return llamadas
      .filter(llamada => new Date(llamada.fechaLlamada) > ahora && llamada.estado === 'programada')
      .sort((a, b) => new Date(a.fechaLlamada).getTime() - new Date(b.fechaLlamada).getTime())
  }

  useEffect(() => {
    fetchLlamadas()
    configurarWebhookCalendly()
  }, [fetchLlamadas])

  return {
    llamadas,
    loading,
    fetchLlamadas,
    crearLlamada,
    actualizarLlamada,
    eliminarLlamada,
    procesarEventoCalendly,
    sincronizarConOutlook,
    obtenerProximasLlamadas
  }
}
