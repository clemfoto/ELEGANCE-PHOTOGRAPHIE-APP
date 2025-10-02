
import React, { useState } from 'react'
import {Plus, Edit2, Trash2, Save, X, Camera, Video, BookOpen, Package, Star} from 'lucide-react'
import { useServicios } from '../hooks/useServicios'

export default function Servicios() {
  const { servicios, loading, addServicio, updateServicio, deleteServicio } = useServicios()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'fotografia' as 'fotografia' | 'video' | 'fotografia_video' | 'album' | 'paquete_completo' | 'extras',
    descripcion: '',
    precio: '',
    divisa: 'EUR' as 'EUR' | 'MXN' | 'USD' | 'CAD',
    activo: true
  })

  const categorias = {
    fotografia: { icon: Camera, label: 'Fotografía', color: 'bg-blue-100 text-blue-800' },
    video: { icon: Video, label: 'Video', color: 'bg-purple-100 text-purple-800' },
    fotografia_video: { icon: Star, label: 'Foto + Video', color: 'bg-indigo-100 text-indigo-800' },
    album: { icon: BookOpen, label: 'Álbum', color: 'bg-green-100 text-green-800' },
    paquete_completo: { icon: Package, label: 'Paquete Completo', color: 'bg-yellow-100 text-yellow-800' },
    extras: { icon: Plus, label: 'Extras', color: 'bg-gray-100 text-gray-800' }
  }

  const divisas = {
    EUR: '€',
    MXN: '$',
    USD: 'USD$',
    CAD: 'CAD$'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const servicioData = {
        ...formData,
        precio: parseFloat(formData.precio) || 0
      }

      if (editingId) {
        await updateServicio(editingId, servicioData)
        setEditingId(null)
      } else {
        await addServicio(servicioData)
      }

      setFormData({
        nombre: '',
        categoria: 'fotografia',
        descripcion: '',
        precio: '',
        divisa: 'EUR',
        activo: true
      })
      setShowForm(false)
    } catch (error) {
      console.error('Error guardando servicio:', error)
    }
  }

  const handleEdit = (servicio: any) => {
    setFormData({
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      descripcion: servicio.descripcion,
      precio: servicio.precio?.toString() || '',
      divisa: servicio.divisa || 'EUR',
      activo: servicio.activo !== false
    })
    setEditingId(servicio._id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      try {
        await deleteServicio(id)
      } catch (error) {
        console.error('Error eliminando servicio:', error)
      }
    }
  }

  const cancelEdit = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      nombre: '',
      categoria: 'fotografia',
      descripcion: '',
      precio: '',
      divisa: 'EUR',
      activo: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <button
              onClick={cancelEdit}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(categorias).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <div className="flex">
                  <select
                    value={formData.divisa}
                    onChange={(e) => setFormData({ ...formData, divisa: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(divisas).map(([key, symbol]) => (
                      <option key={key} value={key}>{symbol}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Servicio activo</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe los detalles del servicio..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Actualizar' : 'Guardar'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicios.map((servicio) => {
          const categoria = categorias[servicio.categoria] || categorias.fotografia
          const IconComponent = categoria.icon

          return (
            <div
              key={servicio._id}
              className={`bg-white rounded-lg shadow p-6 ${
                servicio.activo === false ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${categoria.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{servicio.nombre}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoria.color}`}>
                      {categoria.label}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(servicio)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(servicio._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {servicio.descripcion && (
                <p className="text-gray-600 text-sm mb-3">{servicio.descripcion}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  {divisas[servicio.divisa || 'EUR']}{servicio.precio || 0}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  servicio.activo !== false 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {servicio.activo !== false ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {servicios.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios</h3>
          <p className="text-gray-500 mb-4">Comienza agregando tu primer servicio</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Servicio</span>
          </button>
        </div>
      )}
    </div>
  )
}
