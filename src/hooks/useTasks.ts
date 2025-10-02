
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

export interface Task {
  _id: string
  title: string
  description?: string
  enfoque?: string
  objetivo?: string
  tiempoEstimado?: number
  color?: string
  assignedTo?: 'CLEM' | 'DIANA'
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  status?: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
  notes?: string
  createdAt: string
  updatedAt: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await lumi.entities.tasks.list({
        sort: { createdAt: -1 }
      })
      
      // Validación defensiva de la respuesta
      if (response && Array.isArray(response.list)) {
        setTasks(response.list)
      } else if (Array.isArray(response)) {
        setTasks(response)
      } else {
        console.warn('Respuesta inesperada de tasks:', response)
        setTasks([])
      }
    } catch (err: any) {
      console.error('Error cargando tasks:', err)
      setError('Error al cargar las tareas')
      setTasks([])
      toast.error('Error al cargar las tareas')
    } finally {
      setLoading(false)
    }
  }

  const crearTask = async (taskData: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validar datos requeridos
      if (!taskData.title || !taskData.title.trim()) {
        throw new Error('El título es obligatorio')
      }

      const newTask = {
        ...taskData,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        enfoque: taskData.enfoque?.trim() || '',
        objetivo: taskData.objetivo?.trim() || '',
        notes: taskData.notes?.trim() || '',
        assignedTo: taskData.assignedTo || 'CLEM',
        priority: taskData.priority || 'medium',
        completed: taskData.completed || false,
        status: taskData.status || 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const created = await lumi.entities.tasks.create(newTask)
      
      if (created && created._id) {
        setTasks(prev => [created, ...prev])
        return created
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (err: any) {
      console.error('Error creando task:', err)
      const message = err.message || 'Error al crear tarea'
      toast.error(message)
      throw new Error(message)
    }
  }

  const actualizarTask = async (id: string, updates: Partial<Task>) => {
    try {
      // Validar ID
      if (!id || typeof id !== 'string') {
        throw new Error('ID de tarea inválido')
      }
      
      // Validar que la tarea existe
      const taskExists = tasks.find(task => task._id === id)
      if (!taskExists) {
        throw new Error('Tarea no encontrada')
      }
      
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // Limpiar campos de texto
      if (updatedData.title) {
        updatedData.title = updatedData.title.trim()
      }
      if (updatedData.description) {
        updatedData.description = updatedData.description.trim()
      }
      if (updatedData.enfoque) {
        updatedData.enfoque = updatedData.enfoque.trim()
      }
      if (updatedData.objetivo) {
        updatedData.objetivo = updatedData.objetivo.trim()
      }
      if (updatedData.notes) {
        updatedData.notes = updatedData.notes.trim()
      }
      
      const updated = await lumi.entities.tasks.update(id, updatedData)
      
      setTasks(prev => prev.map(task => 
        task._id === id ? { ...task, ...updated } : task
      ))
      
      return updated
    } catch (err: any) {
      console.error('Error actualizando task:', err)
      const message = err.message || 'Error al actualizar tarea'
      toast.error(message)
      throw new Error(message)
    }
  }

  const eliminarTask = async (id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('ID de tarea inválido')
      }
      
      // Validar que la tarea existe
      const taskExists = tasks.find(task => task._id === id)
      if (!taskExists) {
        throw new Error('Tarea no encontrada')
      }
      
      await lumi.entities.tasks.delete(id)
      setTasks(prev => prev.filter(task => task._id !== id))
    } catch (err: any) {
      console.error('Error eliminando task:', err)
      const message = err.message || 'Error al eliminar tarea'
      toast.error(message)
      throw new Error(message)
    }
  }

  const getTaskById = (id: string) => {
    if (!id || typeof id !== 'string') return null
    return tasks.find(task => task && task._id === id) || null
  }

  const getTasksByAssignee = (assignee: 'CLEM' | 'DIANA') => {
    return tasks.filter(task => task && task.assignedTo === assignee)
  }

  const getCompletedTasks = () => {
    return tasks.filter(task => task && task.completed)
  }

  const getPendingTasks = () => {
    return tasks.filter(task => task && !task.completed)
  }

  const getTasksByPriority = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    return tasks.filter(task => task && task.priority === priority)
  }

  const getTasksByStatus = (status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada') => {
    return tasks.filter(task => task && task.status === status)
  }

  useEffect(() => {
    cargarTasks()
  }, [])

  return {
    tasks: tasks || [],
    loading,
    error,
    crearTask,
    actualizarTask,
    eliminarTask,
    getTaskById,
    getTasksByAssignee,
    getCompletedTasks,
    getPendingTasks,
    getTasksByPriority,
    getTasksByStatus,
    refreshTasks: cargarTasks
  }
}
