
import React, { useState } from 'react'
import { useInformacionGeneral } from '../hooks/useInformacionGeneral'
import {Plus, Edit, Save, Trash2, X, FileText, AlertCircle, RefreshCw} from 'lucide-react'
import toast from 'react-hot-toast'

const InformacionGeneral: React.FC = () => {
  const { 
    informaciones, 
    loading, 
    error,
    crearInformacion, 
    actualizarInformacion, 
    eliminarInformacion,
    cargarInformaciones
  } = useInformacionGeneral()
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newInfo, setNewInfo] = useState({
    titulo: '',
    descripcion: ''
  })
  const [editData, setEditData] = useState({
    titulo: '',
    descripcion: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🎯 === INICIANDO SUBMIT DEL FORMULARIO ===')
    console.log('📝 Datos del formulario:', newInfo)
    
    // Validaciones
    if (!newInfo.titulo.trim()) {
      console.error('❌ Título vacío')
      toast.error('El título es obligatorio')
      return
    }

    setSaving(true)
    
    try {
      console.log('💾 Iniciando guardado...')
      console.log('📊 Estado antes del guardado:')
      console.log('  - Saving:', saving)
      console.log('  - Loading:', loading)
      console.log('  - Error:', error)
      console.log('  - Informaciones count:', informaciones.length)
      
      const datosParaGuardar = {
        titulo: newInfo.titulo.trim(),
        descripcion: newInfo.descripcion.trim()
      }
      
      console.log('📦 Datos que se van a guardar:', datosParaGuardar)
      
      const resultado = await crearInformacion(datosParaGuardar)
      
      console.log('✅ Resultado recibido:', resultado)
      
      // Limpiar formulario solo si fue exitoso
      setNewInfo({ titulo: '', descripcion: '' })
      setShowForm(false)
      
      console.log('✅ Formulario limpiado y cerrado')
      toast.success('Información creada exitosamente')
      
    } catch (error: any) {
      console.error('❌ === ERROR EN SUBMIT ===')
      console.error('❌ Error completo:', error)
      console.error('❌ Mensaje de error:', error.message)
      console.error('❌ Stack trace:', error.stack)
      
      toast.error(error.message || 'Error al crear información')
    } finally {
      setSaving(false)
      console.log('🏁 Guardado finalizado, saving = false')
    }
  }

  const startEdit = (info: any) => {
    console.log('✏️ Iniciando edición de:', info)
    setEditingId(info._id)
    setEditData({
      titulo: info.titulo,
      descripcion: info.descripcion
    })
  }

  const cancelEdit = () => {
    console.log('❌ Cancelando edición')
    setEditingId(null)
    setEditData({ titulo: '', descripcion: '' })
  }

  const saveEdit = async (id: string) => {
    if (!editData.titulo.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    try {
      console.log('💾 Guardando edición:', id, editData)
      await actualizarInformacion(id, {
        titulo: editData.titulo.trim(),
        descripcion: editData.descripcion.trim()
      })
      setEditingId(null)
      setEditData({ titulo: '', descripcion: '' })
      toast.success('Información actualizada exitosamente')
    } catch (error: any) {
      console.error('❌ Error al actualizar:', error)
      toast.error(error.message || 'Error al actualizar información')
    }
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${titulo}"?`)) {
      try {
        console.log('🗑️ Eliminando:', id, titulo)
        await eliminarInformacion(id)
        toast.success('Información eliminada exitosamente')
      } catch (error: any) {
        console.error('❌ Error al eliminar:', error)
        toast.error(error.message || 'Error al eliminar información')
      }
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 Refrescando datos manualmente...')
    try {
      await cargarInformaciones()
      toast.success('Datos actualizados')
    } catch (error: any) {
      toast.error('Error al actualizar datos')
    }
  }

  // Debug en tiempo real
  console.log('🎯 === RENDER DE COMPONENTE ===')
  console.log('📊 Estado actual:')
  console.log('  - Loading:', loading)
  console.log('  - Saving:', saving)
  console.log('  - Error:', error)
  console.log('  - Show form:', showForm)
  console.log('  - Informaciones count:', informaciones?.length || 0)
  console.log('  - Informaciones:', informaciones)
  console.log('  - New info:', newInfo)

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando información...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Información General</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={saving || loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Información
            </button>
          </div>
        </div>

        {/* Mostrar errores si los hay */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para nueva información */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Información</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInfo.titulo}
                    onChange={(e) => {
                      console.log('📝 Cambio en título:', e.target.value)
                      setNewInfo(prev => ({ ...prev, titulo: e.target.value }))
                    }}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                    placeholder="Título de la información"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={newInfo.descripcion}
                    onChange={(e) => {
                      console.log('📝 Cambio en descripción:', e.target.value)
                      setNewInfo(prev => ({ ...prev, descripcion: e.target.value }))
                    }}
                    rows={4}
                    className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                    placeholder="Descripción de la información"
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('❌ Cancelando formulario')
                    setShowForm(false)
                    setNewInfo({ titulo: '', descripcion: '' })
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !newInfo.titulo.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Crear Información'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de información */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Lista de Información ({informaciones?.length || 0})
            </h3>
            
            {informaciones && informaciones.length > 0 ? (
              <div className="space-y-4">
                {informaciones.map(info => (
                  <div
                    key={info._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {editingId === info._id ? (
                      // Modo edición
                      <div className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={editData.titulo}
                            onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                            className="block w-full text-lg font-medium border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                            placeholder="Título"
                          />
                        </div>
                        <div>
                          <textarea
                            value={editData.descripcion}
                            onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                            rows={3}
                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                            placeholder="Descripción"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <X className="mr-1 h-3 w-3" />
                            Cancelar
                          </button>
                          <button
                            onClick={() => saveEdit(info._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            <Save className="mr-1 h-3 w-3" />
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Modo vista
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <FileText className="mr-2 h-5 w-5 text-blue-600" />
                              <h4 className="text-lg font-medium text-gray-900">
                                {info.titulo}
                              </h4>
                            </div>
                            {info.descripcion && (
                              <p className="text-gray-600 mb-3 whitespace-pre-wrap">
                                {info.descripcion}
                              </p>
                            )}
                            <div className="text-xs text-gray-500">
                              Creado: {new Date(info.fechaCreacion).toLocaleString('es-ES')}
                              {info.fechaModificacion !== info.fechaCreacion && (
                                <span className="ml-4">
                                  Modificado: {new Date(info.fechaModificacion).toLocaleString('es-ES')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => startEdit(info)}
                              className="inline-flex items-center px-2 py-1 border border-transparent rounded text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(info._id, info.titulo)}
                              className="inline-flex items-center px-2 py-1 border border-transparent rounded text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay información</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comienza creando tu primera entrada de información.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Información
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel de debug - Solo en desarrollo */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs font-mono">
          <h4 className="font-bold mb-2">🐛 Debug Info:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Estados:</strong>
              <br />• Loading: {loading.toString()}
              <br />• Saving: {saving.toString()}
              <br />• Error: {error || 'ninguno'}
              <br />• Show form: {showForm.toString()}
              <br />• Editing ID: {editingId || 'ninguno'}
            </div>
            <div>
              <strong>Datos:</strong>
              <br />• Informaciones count: {informaciones?.length || 0}
              <br />• Título nuevo: "{newInfo.titulo}"
              <br />• Descripción nueva: "{newInfo.descripcion}"
              <br />• SDK disponible: {typeof window !== 'undefined' && window.lumi ? 'Sí' : 'No'}
            </div>
          </div>
          
          {informaciones && informaciones.length > 0 && (
            <div className="mt-2">
              <strong>Últimas informaciones:</strong>
              <pre className="text-xs bg-gray-200 p-2 rounded mt-1 overflow-auto max-h-32">
                {JSON.stringify(informaciones.slice(0, 2), null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InformacionGeneral
