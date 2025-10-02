
import React, { useState } from 'react'
import { useClientes, Invitado } from '../hooks/useClientes'
import {Plus, Edit2, Trash2, Check, X, Users, UserCheck, UserX} from 'lucide-react'

interface ListaInvitadosProps {
  clienteId: string
  invitados: Invitado[]
  readonly?: boolean
}

const ListaInvitados: React.FC<ListaInvitadosProps> = ({ 
  clienteId, 
  invitados = [], 
  readonly = false 
}) => {
  const { 
    agregarInvitado, 
    tacharInvitado, 
    editarInvitado, 
    eliminarInvitado,
    getEstadisticasInvitados 
  } = useClientes()

  const [nuevoInvitado, setNuevoInvitado] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Obtener estadísticas de forma segura
  const estadisticas = React.useMemo(() => {
    try {
      return getEstadisticasInvitados(clienteId)
    } catch (err) {
      console.error('Error obteniendo estadísticas:', err)
      return { total: 0, tachados: 0, pendientes: 0 }
    }
  }, [clienteId, invitados, getEstadisticasInvitados])

  const handleAgregarInvitado = async () => {
    if (!nuevoInvitado.trim()) {
      setError('El nombre del invitado no puede estar vacío')
      return
    }

    try {
      setLoading('agregando')
      setError(null)
      await agregarInvitado(clienteId, nuevoInvitado.trim())
      setNuevoInvitado('')
      setAgregando(false)
    } catch (error: any) {
      console.error('Error agregando invitado:', error)
      setError(error.message || 'Error al agregar invitado')
    } finally {
      setLoading(null)
    }
  }

  const handleTacharInvitado = async (invitadoId: string) => {
    try {
      setLoading(invitadoId)
      setError(null)
      await tacharInvitado(clienteId, invitadoId)
    } catch (error: any) {
      console.error('Error tachando invitado:', error)
      setError(error.message || 'Error al tachar invitado')
    } finally {
      setLoading(null)
    }
  }

  const handleEditarInvitado = async (invitadoId: string) => {
    if (!nombreEditado.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }

    try {
      setLoading(invitadoId)
      setError(null)
      await editarInvitado(clienteId, invitadoId, nombreEditado.trim())
      setEditando(null)
      setNombreEditado('')
    } catch (error: any) {
      console.error('Error editando invitado:', error)
      setError(error.message || 'Error al editar invitado')
    } finally {
      setLoading(null)
    }
  }

  const handleEliminarInvitado = async (invitadoId: string) => {
    const invitado = invitados.find(inv => inv.id === invitadoId)
    const nombreInvitado = invitado?.nombre || 'este invitado'
    
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${nombreInvitado}"?`)) return

    try {
      setLoading(invitadoId)
      setError(null)
      await eliminarInvitado(clienteId, invitadoId)
    } catch (error: any) {
      console.error('Error eliminando invitado:', error)
      setError(error.message || 'Error al eliminar invitado')
    } finally {
      setLoading(null)
    }
  }

  const iniciarEdicion = (invitado: Invitado) => {
    setEditando(invitado.id)
    setNombreEditado(invitado.nombre)
    setError(null)
  }

  const cancelarEdicion = () => {
    setEditando(null)
    setNombreEditado('')
    setError(null)
  }

  const cancelarAgregar = () => {
    setAgregando(false)
    setNuevoInvitado('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Lista de Invitados</span>
        </h4>
        
        {estadisticas.total > 0 && (
          <div className="flex items-center space-x-4 text-sm bg-gray-50 px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-1 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-medium">{estadisticas.total}</span>
              <span className="text-xs">total</span>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <UserCheck className="w-4 h-4" />
              <span className="font-medium">{estadisticas.tachados}</span>
              <span className="text-xs">confirmados</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-600">
              <UserX className="w-4 h-4" />
              <span className="font-medium">{estadisticas.pendientes}</span>
              <span className="text-xs">pendientes</span>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Botón para agregar invitado */}
      {!readonly && !agregando && (
        <button
          onClick={() => setAgregando(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Agregar nuevo invitado</span>
        </button>
      )}

      {/* Formulario para agregar invitado */}
      {agregando && (
        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
          <div className="flex space-x-2">
            <input
              type="text"
              value={nuevoInvitado}
              onChange={(e) => setNuevoInvitado(e.target.value)}
              placeholder="Escribe el nombre del invitado..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAgregarInvitado()
                }
                if (e.key === 'Escape') {
                  cancelarAgregar()
                }
              }}
              autoFocus
            />
            <button
              onClick={handleAgregarInvitado}
              disabled={!nuevoInvitado.trim() || loading === 'agregando'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              title="Agregar invitado"
            >
              {loading === 'agregando' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Agregar</span>
            </button>
            <button
              onClick={cancelarAgregar}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center space-x-2 transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Presiona Enter para agregar o Escape para cancelar
          </p>
        </div>
      )}

      {/* Lista de invitados */}
      {invitados.length > 0 ? (
        <div className="space-y-3">
          {invitados.map((invitado, index) => (
            <div
              key={invitado.id}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                invitado.tachado 
                  ? 'bg-green-50 border-green-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {editando === invitado.id ? (
                // Modo edición
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={nombreEditado}
                      onChange={(e) => setNombreEditado(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleEditarInvitado(invitado.id)
                        }
                        if (e.key === 'Escape') {
                          cancelarEdicion()
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleEditarInvitado(invitado.id)}
                      disabled={!nombreEditado.trim() || loading === invitado.id}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
                      title="Guardar cambios"
                    >
                      {loading === invitado.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Guardar</span>
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                      title="Cancelar edición"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    💡 Presiona Enter para guardar o Escape para cancelar
                  </p>
                </div>
              ) : (
                // Modo vista
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Número de invitado */}
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    
                    {/* Botón para tachar/confirmar */}
                    <button
                      onClick={() => handleTacharInvitado(invitado.id)}
                      disabled={readonly || loading === invitado.id}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        invitado.tachado
                          ? 'bg-green-500 border-green-500 text-white shadow-md scale-110'
                          : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      } ${readonly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      title={invitado.tachado ? 'Marcar como pendiente' : 'Marcar como confirmado'}
                    >
                      {loading === invitado.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                      ) : invitado.tachado ? (
                        <Check className="w-4 h-4" />
                      ) : null}
                    </button>
                    
                    {/* Nombre del invitado */}
                    <div className="flex-1">
                      <span
                        className={`text-base transition-all duration-200 ${
                          invitado.tachado
                            ? 'line-through text-gray-500 font-medium'
                            : 'text-gray-900'
                        }`}
                      >
                        {invitado.nombre}
                      </span>
                      
                      {/* Información adicional */}
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-400">
                          Agregado: {new Date(invitado.fechaAgregado).toLocaleDateString()}
                        </span>
                        
                        {invitado.tachado && invitado.fechaTachado && (
                          <span className="text-xs text-green-600 font-medium">
                            ✅ Confirmado: {new Date(invitado.fechaTachado).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  {!readonly && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => iniciarEdicion(invitado)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar nombre"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarInvitado(invitado.id)}
                        disabled={loading === invitado.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar invitado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay invitados agregados</h3>
          <p className="text-gray-500 mb-4">Comienza agregando invitados a la lista</p>
          {!readonly && (
            <button
              onClick={() => setAgregando(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar primer invitado</span>
            </button>
          )}
        </div>
      )}

      {/* Información de ayuda */}
      {invitados.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Cómo usar la lista de invitados:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-800">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-green-500 rounded-full flex items-center justify-center">
                <Check className="w-2 h-2 text-green-500" />
              </div>
              <span>Haz clic en el círculo para confirmar asistencia</span>
            </div>
            <div className="flex items-center space-x-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>Usa el ícono de edición para cambiar el nombre</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Usa la papelera para eliminar permanentemente</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 line-through">Texto tachado</span>
              <span>= Invitado confirmado</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListaInvitados
