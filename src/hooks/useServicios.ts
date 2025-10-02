
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'

export type TipoServicio = 'fotografia' | 'video' | 'fotografia_video' | 'album' | 'paquete_completo' | 'extras'
export type Divisa = 'EUR' | 'MXN' | 'USD' | 'CAD'

export interface Servicio {
  _id?: string
  nombre: string
  categoria: TipoServicio
  descripcion?: string
  precio?: number
  divisa: Divisa
  activo: boolean
  createdAt?: string
  updatedAt?: string
}

export function useServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServicios = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await lumi.entities.servicios.list({
        sort: { categoria: 1, nombre: 1 }
      })
      setServicios(response.list || [])
    } catch (err: any) {
      console.error('Error loading servicios:', err)
      setError('Error al cargar los servicios')
      setServicios([])
    } finally {
      setLoading(false)
    }
  }

  const addServicio = async (servicioData: Omit<Servicio, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newServicio = {
        ...servicioData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const created = await lumi.entities.servicios.create(newServicio)
      setServicios(prev => [...prev, created])
      return created
    } catch (err: any) {
      console.error('Error adding servicio:', err)
      throw err
    }
  }

  const updateServicio = async (id: string, updates: Partial<Servicio>) => {
    try {
      if (typeof id !== 'string') {
        throw new Error('ID debe ser una cadena')
      }
      
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      const updated = await lumi.entities.servicios.update(id, updatedData)
      setServicios(prev => prev.map(servicio => 
        servicio._id === id ? { ...servicio, ...updated } : servicio
      ))
      return updated
    } catch (err: any) {
      console.error('Error updating servicio:', err)
      throw err
    }
  }

  const deleteServicio = async (id: string) => {
    try {
      if (typeof id !== 'string') {
        throw new Error('ID debe ser una cadena')
      }
      
      await lumi.entities.servicios.delete(id)
      setServicios(prev => prev.filter(servicio => servicio._id !== id))
    } catch (err: any) {
      console.error('Error deleting servicio:', err)
      throw err
    }
  }

  const getServicioById = (id: string) => {
    return servicios.find(servicio => servicio._id === id)
  }

  const getServiciosPorCategoria = (categoria: TipoServicio) => {
    return servicios.filter(servicio => servicio.categoria === categoria && servicio.activo)
  }

  const getServiciosActivos = () => {
    return servicios.filter(servicio => servicio.activo)
  }

  useEffect(() => {
    loadServicios()
  }, [])

  return {
    servicios,
    loading,
    error,
    addServicio,
    updateServicio,
    deleteServicio,
    getServicioById,
    getServiciosPorCategoria,
    getServiciosActivos,
    refreshServicios: loadServicios
  }
}
