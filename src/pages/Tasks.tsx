
import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import {Plus, Check, X, Calendar} from 'lucide-react'
import toast from 'react-hot-toast'

const Tasks: React.FC = () => {
  const { tasks, loading, crearTask, actualizarTask } = useTasks()
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    try {
      await crearTask({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        dueDate: newTask.dueDate || undefined,
        completed: false,
        priority: 'medium'
      })
      
      setNewTask({ title: '', description: '', dueDate: '' })
      setShowForm(false)
      toast.success('Tarea creada exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al crear tarea')
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await actualizarTask(taskId, { completed: !completed })
      toast.success(completed ? 'Tarea marcada como pendiente' : 'Tarea completada')
    } catch (error: any) {
      toast.error('Error al actualizar tarea')
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tareas</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </button>
        </div>

        {/* Formulario para nueva tarea */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Título de la tarea"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción de la tarea"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha límite
                  </label>
                  <input
                    type="datetime-local"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de tareas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Lista de Tareas
            </h3>
            
            {tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task._id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleTask(task._id, task.completed)}
                        className={`p-1 rounded-full ${
                          task.completed 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      
                      <div>
                        <h4 className={`font-medium ${
                          task.completed ? 'text-green-900 line-through' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className={`text-sm ${
                            task.completed ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.dueDate).toLocaleString('es-ES')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No hay tareas creadas aún. ¡Crea tu primera tarea!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tasks
