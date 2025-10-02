
import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import {Plus, SquareCheck as CheckSquare, Square, Calendar, User, AlertTriangle, Edit3, Trash2, Filter} from 'lucide-react'
import toast from 'react-hot-toast'
import TaskEditor from '../components/TaskEditor'

const TareasPersonal: React.FC = () => {
  const { tasks, loading, crearTask, actualizarTask, eliminarTask } = useTasks()
  const [showEditor, setShowEditor] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filtroPersona, setFiltroPersona] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todas')

  // Validación defensiva de tasks
  const tasksList = Array.isArray(tasks) ? tasks : []

  const handleCreateTask = async (taskData) => {
    try {
      await crearTask(taskData)
      setShowEditor(false)
      toast.success('Tarea creada exitosamente')
    } catch (error) {
      console.error('Error creando tarea:', error)
      toast.error('Error al crear tarea')
    }
  }

  const handleUpdateTask = async (id, updates) => {
    try {
      await actualizarTask(id, updates)
      setEditingTask(null)
      setShowEditor(false)
      toast.success('Tarea actualizada exitosamente')
      return true
    } catch (error) {
      console.error('Error actualizando tarea:', error)
      toast.error('Error al actualizar tarea')
      return false
    }
  }

  const handleDeleteTask = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return
    
    try {
      await eliminarTask(id)
      toast.success('Tarea eliminada exitosamente')
    } catch (error) {
      console.error('Error eliminando tarea:', error)
      toast.error('Error al eliminar tarea')
    }
  }

  const toggleTaskCompletion = async (task) => {
    if (!task || !task._id) return
    
    try {
      await actualizarTask(task._id, { 
        completed: !task.completed,
        status: !task.completed ? 'completada' : 'pendiente'
      })
      toast.success(task.completed ? 'Tarea marcada como pendiente' : 'Tarea completada')
    } catch (error) {
      console.error('Error actualizando estado:', error)
      toast.error('Error al actualizar estado')
    }
  }

  // Filtrar tareas de forma segura
  const tareasFiltradas = tasksList.filter(task => {
    if (!task) return false
    
    const cumpleFiltroPersona = filtroPersona === 'todas' || 
      (task.assignedTo && task.assignedTo.toLowerCase() === filtroPersona.toLowerCase())
    
    const cumpleFiltroEstado = filtroEstado === 'todas' || 
      (task.completed === (filtroEstado === 'completadas'))
    
    return cumpleFiltroPersona && cumpleFiltroEstado
  })

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800', 
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return colors[priority] || colors['medium']
  }

  const getStatusColor = (status) => {
    const colors = {
      'pendiente': 'bg-gray-100 text-gray-800',
      'en_progreso': 'bg-blue-100 text-blue-800',
      'completada': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800'
    }
    return colors[status] || colors['pendiente']
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando tareas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tareas del Equipo</h1>
            <p className="text-gray-600 mt-1">Gestión de tareas para Clem y Diana</p>
          </div>
          <button
            onClick={() => {
              setEditingTask(null)
              setShowEditor(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Persona</label>
              <select
                value={filtroPersona}
                onChange={(e) => setFiltroPersona(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="clem">Clem</option>
                <option value="diana">Diana</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas</option>
                <option value="pendientes">Pendientes</option>
                <option value="completadas">Completadas</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Mostrando {tareasFiltradas.length} de {tasksList.length} tareas
            </div>
          </div>
        </div>

        {/* Editor de Tareas */}
        {showEditor && (
          <div className="mb-6">
            <TaskEditor
              task={editingTask}
              onUpdate={handleUpdateTask}
              onCreate={handleCreateTask}
              onCancel={() => {
                setShowEditor(false)
                setEditingTask(null)
              }}
            />
          </div>
        )}

        {/* Lista de Tareas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {tareasFiltradas.length > 0 ? (
              <div className="space-y-4">
                {tareasFiltradas.map(task => {
                  if (!task || !task._id) return null
                  
                  return (
                    <div
                      key={task._id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <button
                            onClick={() => toggleTaskCompletion(task)}
                            className={`mt-1 p-1 rounded ${
                              task.completed 
                                ? 'text-green-600 hover:text-green-700' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {task.completed ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className={`font-medium ${
                                task.completed ? 'text-green-900 line-through' : 'text-gray-900'
                              }`}>
                                {task.title || 'Sin título'}
                              </h3>
                              
                              {task.priority && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                                  {task.priority === 'low' ? 'Baja' : 
                                   task.priority === 'medium' ? 'Media' : 
                                   task.priority === 'high' ? 'Alta' : 'Urgente'}
                                </span>
                              )}
                              
                              {task.status && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                  {task.status === 'pendiente' ? 'Pendiente' :
                                   task.status === 'en_progreso' ? 'En Progreso' :
                                   task.status === 'completada' ? 'Completada' : 'Cancelada'}
                                </span>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className={`text-sm mb-2 ${
                                task.completed ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              {task.assignedTo && (
                                <div className="flex items-center">
                                  <User className="mr-1 h-3 w-3" />
                                  {task.assignedTo}
                                </div>
                              )}
                              
                              {task.dueDate && (
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString('es-ES')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingTask(task)
                              setShowEditor(true)
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <CheckSquare className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filtroPersona !== 'todas' || filtroEstado !== 'todas' 
                    ? 'No hay tareas que coincidan con los filtros seleccionados.'
                    : 'Comienza creando una nueva tarea.'}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setEditingTask(null)
                      setShowEditor(true)
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarea
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TareasPersonal
