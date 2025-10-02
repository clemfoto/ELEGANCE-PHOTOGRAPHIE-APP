
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'

interface Gasto {
  _id: string
  descripcion: string
  monto: number
  categoria: string
  fecha: string
  createdAt?: string
  updatedAt?: string
}

export const useContabilidad = () => {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarGastos()
  }, [])

  const cargarGastos = async () => {
    try {
      setLoading(true)
      const data = await lumi.entities.gastos.read()
      setGastos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar gastos:', error)
      setGastos([])
    } finally {
      setLoading(false)
    }
  }

  const crearGasto = async (gastoData: Omit<Gasto, '_id'>) => {
    try {
      const nuevoGasto = await lumi.entities.gastos.create(gastoData)
      setGastos(prev => [nuevoGasto, ...prev])
      return nuevoGasto
    } catch (error) {
      console.error('Error al crear gasto:', error)
      throw error
    }
  }

  const actualizarGasto = async (id: string, updates: Partial<Gasto>) => {
    try {
      const gastoActualizado = await lumi.entities.gastos.update(id, updates)
      setGastos(prev => prev.map(gasto => 
        gasto._id === id ? { ...gasto, ...gastoActualizado } : gasto
      ))
      return gastoActualizado
    } catch (error) {
      console.error('Error al actualizar gasto:', error)
      throw error
    }
  }

  const eliminarGasto = async (id: string) => {
    try {
      await lumi.entities.gastos.delete(id)
      setGastos(prev => prev.filter(gasto => gasto._id !== id))
    } catch (error) {
      console.error('Error al eliminar gasto:', error)
      throw error
    }
  }

  return {
    gastos,
    loading,
    crearGasto,
    actualizarGasto,
    eliminarGasto,
    cargarGastos
  }
}
