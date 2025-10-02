
import React, { useState, useEffect } from 'react'
import { Task } from '../hooks/useTasks'
import {Save, X, Calendar, User, AlertTriangle} from 'lucide-react'
import toast from 'react-hot-toast'

interface TaskEditorProps {
  task?: Task | null
  onUpdate?: (id: string, updates: Partial<Task>) => Promise<boolean>
  onCancel: () => void
  onCreate?: (taskData: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Task>
}

const TaskEditor: React.FC<TaskEditorProps> = ({ 
  task, 
  onUpdate, 
  onCancel, 
  onCreate 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    enfoque: '',
    objetivo: '',
    tiempoEstimado: '',
    color: '#3B82F6',
    assignedTo: 'CLEM',
    completed: false,
    priority: 'medium',
    dueDate: '',
    status: 'pendiente',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        enfoque: task.enfoque || '',
        objetivo: task.objetivo || '',
        tiempoEstimado: task.tiempoEstimado ? task.tiempoEstimado.toString() : '',
        color: task.color || '#3B82F6',
        assignedTo: task.assignedTo || 'CLEM',
        completed: task.completed || false,
        priority: task.priority || 'medium',
        dueDate: task.dueDate || '',
        status: task.status || 'pendiente',
        notes: task.notes || ''
      })
    }
  }, [task])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title?.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    setSaving(true)
    try {
      const taskData = {
        ...formData,
        tiempoEstimado: formData.tiempoEstimado ? parseInt(formData.tiempoEstimado) : undefined
      }
      
      if (task && task._id && typeof onUpdate === 'function') {
        // Actualizar tarea existente
        const success = await onUpdate(task._id, taskData)
        if (success) {
          toast.success('Tarea actualizada correctamente')
          onCancel()
        } else {
          toast.error('Error al actualizar la tarea')
        }
      } else if (typeof onCreate === 'function') {
        // Crear nueva tarea
        await onCreate(taskData)
        toast.success('Tarea creada correctamente')
        onCancel()
      } else {
        toast.error('No se pudo procesar la tarea')
      }
    } catch (error) {
      console.error('Error en TaskEditor:', error)
      toast.error('Error al guardar la tarea')
    } finally {
      setSaving(false)
    }
  }

  const personas = [
    { value: 'CLEM', label: 'Clem' },
    { value: 'DIANA', label: 'Diana' }
  ]
  
  const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_progreso', label: 'En Progreso' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ]
  
  const prioridades = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ]

  const colores = [
    { value: '#3B82F6', label: 'Azul', class: 'bg-blue-500' },
    { value: '#EF4444', label: 'Rojo', class: 'bg-red-500' },
    { value: '#10B981', label: 'Verde', class: 'bg-green-500' },
    { value: '#F59E0B', label: 'Amarillo', class: 'bg-yellow-500' },
    { value: '#8B5CF6', label: 'Púrpura', class: 'bg-purple-500' },
    { value: '#F97316', label: 'Naranja', class: 'bg-orange-500' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {task ? 'Editar Tarea' : 'Nueva Tarea'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Título de la tarea"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User size={16} className="inline mr-1" />
              Asignado a
            </label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {personas.map(persona => (
                <option key={persona.value} value={persona.value}>{persona.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <AlertTriangle size={16} className="inline mr-1" />
              Prioridad
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {prioridades.map(prioridad => (
                <option key={prioridad.value} value={prioridad.value}>
                  {prioridad.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {estados.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Fecha límite
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo estimado (minutos)
            </label>
            <input
              type="number"
              name="tiempoEstimado"
              value={formData.tiempoEstimado}
              onChange={handleInputChange}
              min="1"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ej: 60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex space-x-2">
              {colores.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                    formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enfoque
            </label>
            <input
              type="text"
              name="enfoque"
              value={formData.enfoque}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="¿En qué se debe enfocar?"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objetivo
            </label>
            <input
              type="text"
              name="objetivo"
              value={formData.objetivo}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="¿Cuál es el objetivo?"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción detallada de la tarea"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {task ? 'Actualizar' : 'Crear'} Tarea
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskEditor
