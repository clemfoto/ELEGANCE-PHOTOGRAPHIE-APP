
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { isValidDate } from '../utils/dateUtils'

export interface Recordatorio {
  _id?: string
  clienteId: string
  fechaRecordatorio: string
  tipo: 'evento_proximo' | 'pago_pendiente' | 'reunion_planificacion' | 'seguimiento' | 'otro'
  mensaje: string
  estado: 'pendiente' | 'completado' | 'cancelado'
  prioridad: 'baja' | 'media' | 'alta' | 'urgente'
  repetir: boolean
  intervaloRepeticion?: string
  canalNotificacion: ('email' | 'sms' | 'whatsapp' | 'sistema')[]
  createdAt?: string
  updatedAt?: string
}

export function useRecordatorios() {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecordatorios = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await lumi.entities.recordatorios.list({
        sort: { fechaRecordatorio: 1 }
      })
      
      // Filtrar recordatorios con fechas válidas
      const validRecordatorios = (response.list || []).filter((recordatorio: Recordatorio) => {
        if (!recordatorio.fechaRecordatorio) {
          console.warn('Recordatorio sin fecha:', recordatorio.mensaje)
          return false
        }
        
        if (!isValidDate(recordatorio.fechaRecordatorio)) {
          console.warn('Recordatorio con fecha inválida:', recordatorio.mensaje, recordatorio.fechaRecordatorio)
          return false
        }
        
        return true
      })
      
      setRecordatorios(validRecordatorios)
    } catch (err: any) {
      console.error('Error loading recordatorios:', err)
      setError('Error al cargar los recordatorios')
      toast.error('Error al cargar los recordatorios')
      setRecordatorios([])
    } finally {
      setLoading(false)
    }
  }

  const addRecordatorio = async (recordatorioData: Omit<Recordatorio, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validar fecha antes de crear
      if (!isValidDate(recordatorioData.fechaRecordatorio)) {
        throw new Error('La fecha del recordatorio no es válida')
      }
      
      const newRecordatorio = {
        ...recordatorioData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const created = await lumi.entities.recordatorios.create(newRecordatorio)
      setRecordatorios(prev => [...prev, created])
      toast.success('Recordatorio agregado exitosamente')
      return created
    } catch (err: any) {
      console.error('Error adding recordatorio:', err)
      toast.error(err.message || 'Error al agregar recordatorio')
      throw err
    }
  }

  const updateRecordatorio = async (id: string, updates: Partial<Recordatorio>) => {
    try {
      if (typeof id !== 'string') {
        throw new Error('ID debe ser una cadena')
      }
      
      // Validar fecha si se está actualizando
      if (updates.fechaRecordatorio && !isValidDate(updates.fechaRecordatorio)) {
        throw new Error('La fecha del recordatorio no es válida')
      }
      
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      const updated = await lumi.entities.recordatorios.update(id, updatedData)
      setRecordatorios(prev => prev.map(recordatorio => 
        recordatorio._id === id ? { ...recordatorio, ...updated } : recordatorio
      ))
      toast.success('Recordatorio actualizado exitosamente')
      return updated
    } catch (err: any) {
      console.error('Error updating recordatorio:', err)
      toast.error(err.message || 'Error al actualizar recordatorio')
      throw err
    }
  }

  const deleteRecordatorio = async (id: string) => {
    try {
      if (typeof id !== 'string') {
        throw new Error('ID debe ser una cadena')
      }
      
      await lumi.entities.recordatorios.delete(id)
      setRecordatorios(prev => prev.filter(recordatorio => recordatorio._id !== id))
      toast.success('Recordatorio eliminado exitosamente')
    } catch (err: any) {
      console.error('Error deleting recordatorio:', err)
      toast.error('Error al eliminar recordatorio')
      throw err
    }
  }

  const getRecordatoriosPendientes = () => {
    const hoy = new Date()
    
    return recordatorios.filter(recordatorio => {
      if (recordatorio.estado !== 'pendiente') return false
      if (!isValidDate(recordatorio.fechaRecordatorio)) return false
      
      try {
        const fechaRecordatorio = new Date(recordatorio.fechaRecordatorio)
        return fechaRecordatorio <= hoy
      } catch (error) {
        console.warn('Error procesando fecha de recordatorio:', recordatorio.mensaje, recordatorio.fechaRecordatorio)
        return false
      }
    })
  }

  const getRecordatoriosByCliente = (clienteId: string) => {
    return recordatorios.filter(recordatorio => recordatorio.clienteId === clienteId)
  }

  const getRecordatoriosProximos = (dias: number = 7) => {
    const hoy = new Date()
    const fechaLimite = new Date()
    fechaLimite.setDate(hoy.getDate() + dias)

    return recordatorios.filter(recordatorio => {
      if (recordatorio.estado !== 'pendiente') return false
      if (!isValidDate(recordatorio.fechaRecordatorio)) return false
      
      try {
        const fechaRecordatorio = new Date(recordatorio.fechaRecordatorio)
        return fechaRecordatorio >= hoy && fechaRecordatorio <= fechaLimite
      } catch (error) {
        console.warn('Error procesando fecha próxima de recordatorio:', recordatorio.mensaje, recordatorio.fechaRecordatorio)
        return false
      }
    })
  }

  useEffect(() => {
    loadRecordatorios()
  }, [])

  return {
    recordatorios,
    loading,
    error,
    addRecordatorio,
    updateRecordatorio,
    deleteRecordatorio,
    getRecordatoriosPendientes,
    getRecordatoriosByCliente,
    getRecordatoriosProximos,
    refreshRecordatorios: loadRecordatorios
  }
}
