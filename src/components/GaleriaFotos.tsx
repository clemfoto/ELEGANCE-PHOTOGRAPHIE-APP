
import React, { useState, useRef } from 'react'
import { useGruposFotos } from '../hooks/useGruposFotos'
import {Upload, FolderPlus, Image, Trash2, Edit, Eye, Grid, List, X, AlertTriangle} from 'lucide-react'

interface GaleriaFotosProps {
  onSelectFotos: (fotos: string[]) => void
  selectedFotos?: string[]
}

const GaleriaFotos: React.FC<GaleriaFotosProps> = ({ onSelectFotos, selectedFotos = [] }) => {
  const { grupos, createGrupo, updateGrupo, deleteGrupo, subirFotos, eliminarFoto } = useGruposFotos()
  const [vistaActual, setVistaActual] = useState<'grid' | 'lista'>('grid')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('todos')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [showNuevoGrupo, setShowNuevoGrupo] = useState(false)
  const [showDetalleGrupo, setShowDetalleGrupo] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState<{foto: any, grupoId: string} | null>(null)
  const [modoSeleccion, setModoSeleccion] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const coloresGrupo = [
    '#FF6B9D', '#4ECDC4', '#FFD93D', '#6BCF7F', '#A8E6CF',
    '#FF8A80', '#81C784', '#64B5F6', '#FFB74D', '#F8BBD9'
  ]

  const categorias = [
    { value: 'boda', label: 'Bodas' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'retratos', label: 'Retratos' },
    { value: 'decoracion', label: 'Decoración' },
    { value: 'otros', label: 'Otros' }
  ]

  // Filtrar grupos
  const gruposFiltrados = grupos.filter(grupo => {
    if (categoriaFiltro !== 'todas' && grupo.categoria !== categoriaFiltro) {
      return false
    }
    return true
  })

  // Obtener todas las fotos según filtros
  const obtenerFotos = () => {
    if (grupoSeleccionado === 'todos') {
      return gruposFiltrados.flatMap(grupo => 
        grupo.fotos.map(foto => ({ ...foto, grupoId: grupo._id, grupoNombre: grupo.nombre }))
      )
    } else {
      const grupo = grupos.find(g => g._id === grupoSeleccionado)
      return grupo ? grupo.fotos.map(foto => ({ ...foto, grupoId: grupo._id, grupoNombre: grupo.nombre })) : []
    }
  }

  const handleSubirFotos = async (files: File[], grupoId?: string) => {
    let targetGrupoId = grupoId

    if (!targetGrupoId) {
      if (grupoSeleccionado === 'todos') {
        // Crear nuevo grupo automáticamente
        const nuevoGrupo = await createGrupo({
          nombre: `Grupo ${new Date().toLocaleDateString()}`,
          descripcion: 'Grupo creado automáticamente',
          fotos: [],
          color: coloresGrupo[Math.floor(Math.random() * coloresGrupo.length)],
          categoria: 'otros',
          creator: 'admin'
        })
        targetGrupoId = nuevoGrupo._id
        setGrupoSeleccionado(targetGrupoId)
      } else {
        targetGrupoId = grupoSeleccionado
      }
    }

    if (targetGrupoId) {
      await subirFotos(targetGrupoId, files)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      handleSubirFotos(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNuevoGrupo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    await createGrupo({
      nombre: formData.get('nombre') as string,
      descripcion: formData.get('descripcion') as string,
      fotos: [],
      color: formData.get('color') as string,
      categoria: formData.get('categoria') as any,
      creator: 'admin'
    })
    
    setShowNuevoGrupo(false)
  }

  const toggleSeleccionFoto = (fotoUrl: string) => {
    const nuevaSeleccion = selectedFotos.includes(fotoUrl)
      ? selectedFotos.filter(url => url !== fotoUrl)
      : [...selectedFotos, fotoUrl]
    
    onSelectFotos(nuevaSeleccion)
  }

  const handleEliminarFoto = async (foto: any, grupoId: string) => {
    setShowConfirmDelete({ foto, grupoId })
  }

  const confirmarEliminarFoto = async () => {
    if (showConfirmDelete) {
      await eliminarFoto(showConfirmDelete.grupoId, showConfirmDelete.foto.url)
      // Remover de la selección si estaba seleccionada
      if (selectedFotos.includes(showConfirmDelete.foto.url)) {
        onSelectFotos(selectedFotos.filter(url => url !== showConfirmDelete.foto.url))
      }
      setShowConfirmDelete(null)
    }
  }

  const eliminarFotosSeleccionadas = async () => {
    const fotosParaEliminar = obtenerFotos().filter(foto => selectedFotos.includes(foto.url))
    
    for (const foto of fotosParaEliminar) {
      await eliminarFoto((foto as any).grupoId, foto.url)
    }
    
    onSelectFotos([])
    setModoSeleccion(false)
  }

  const fotosParaMostrar = obtenerFotos()

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Image className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Galería de Fotos</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Botones de vista */}
          <div className="flex border rounded-md">
            <button
              onClick={() => setVistaActual('grid')}
              className={`p-2 ${vistaActual === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setVistaActual('lista')}
              className={`p-2 ${vistaActual === 'lista' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List size={16} />
            </button>
          </div>

          {/* Modo selección */}
          <button
            onClick={() => setModoSeleccion(!modoSeleccion)}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
              modoSeleccion ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>Seleccionar</span>
          </button>

          {/* Subir fotos */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center space-x-2"
          >
            <Upload size={16} />
            <span>Subir Fotos</span>
          </button>

          {/* Nuevo grupo */}
          <button
            onClick={() => setShowNuevoGrupo(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <FolderPlus size={16} />
            <span>Nuevo Grupo</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Filtro por grupo */}
          <select
            value={grupoSeleccionado}
            onChange={(e) => setGrupoSeleccionado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map(grupo => (
              <option key={grupo._id} value={grupo._id}>
                {grupo.nombre} ({grupo.fotos.length} fotos)
              </option>
            ))}
          </select>

          {/* Filtro por categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Acciones de selección múltiple */}
        {selectedFotos.length > 0 && (
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-md">
              {selectedFotos.length} foto{selectedFotos.length !== 1 ? 's' : ''} seleccionada{selectedFotos.length !== 1 ? 's' : ''}
            </div>
            
            <button
              onClick={eliminarFotosSeleccionadas}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
            >
              <Trash2 size={16} />
              <span>Eliminar Seleccionadas</span>
            </button>
            
            <button
              onClick={() => {
                onSelectFotos([])
                setModoSeleccion(false)
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Lista de grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {gruposFiltrados.map(grupo => (
          <div
            key={grupo._id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowDetalleGrupo(grupo._id)}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: grupo.color }}
              ></div>
              <h3 className="font-semibold text-gray-900 truncate">{grupo.nombre}</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{grupo.descripcion}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{grupo.fotos.length} fotos</span>
              <span className="capitalize">{grupo.categoria}</span>
            </div>
            
            {/* Preview de fotos */}
            {grupo.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-1 mt-3">
                {grupo.fotos.slice(0, 3).map((foto, index) => (
                  <img
                    key={index}
                    src={foto.url}
                    alt={foto.nombre}
                    className="w-full h-16 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Galería de fotos */}
      {vistaActual === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {fotosParaMostrar.map((foto, index) => (
            <div
              key={`${foto.grupoId}-${index}`}
              className={`relative group rounded-lg overflow-hidden ${
                selectedFotos.includes(foto.url) ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              <img
                src={foto.url}
                alt={foto.nombre}
                className="w-full h-32 object-cover cursor-pointer"
                onClick={() => modoSeleccion ? toggleSeleccionFoto(foto.url) : null}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                  {!modoSeleccion && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Aquí puedes agregar lógica para vista previa
                        }}
                        className="bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition-all"
                      >
                        <Eye className="text-gray-700" size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEliminarFoto(foto, (foto as any).grupoId)
                        }}
                        className="bg-red-500 bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition-all"
                      >
                        <Trash2 className="text-white" size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Checkbox de selección */}
              {modoSeleccion && (
                <div className="absolute top-2 right-2">
                  <div className={`w-5 h-5 rounded border-2 border-white cursor-pointer ${
                    selectedFotos.includes(foto.url) ? 'bg-blue-500' : 'bg-black bg-opacity-30'
                  }`}
                  onClick={() => toggleSeleccionFoto(foto.url)}
                  >
                    {selectedFotos.includes(foto.url) && (
                      <div className="text-white text-xs flex items-center justify-center h-full">✓</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Nombre del grupo */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2">
                <div className="truncate">{(foto as any).grupoNombre}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {fotosParaMostrar.map((foto, index) => (
            <div
              key={`${foto.grupoId}-${index}`}
              className={`flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 ${
                selectedFotos.includes(foto.url) ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <img
                src={foto.url}
                alt={foto.nombre}
                className="w-16 h-16 object-cover rounded"
              />
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{foto.nombre}</h4>
                <p className="text-sm text-gray-600">{(foto as any).grupoNombre}</p>
                <p className="text-xs text-gray-500">
                  {new Date(foto.fechaSubida).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {modoSeleccion ? (
                  <input
                    type="checkbox"
                    checked={selectedFotos.includes(foto.url)}
                    onChange={() => toggleSeleccionFoto(foto.url)}
                    className="w-5 h-5 text-blue-600"
                  />
                ) : (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        // Vista previa
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEliminarFoto(foto, (foto as any).grupoId)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para nuevo grupo */}
      {showNuevoGrupo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Crear Nuevo Grupo</h3>
            <form onSubmit={handleNuevoGrupo}>
              <div className="space-y-4">
                <input
                  name="nombre"
                  placeholder="Nombre del grupo"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                
                <textarea
                  name="descripcion"
                  placeholder="Descripción"
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                
                <select
                  name="categoria"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color identificativo
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {coloresGrupo.map(color => (
                      <label key={color} className="cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          className="sr-only"
                          defaultChecked={color === coloresGrupo[0]}
                        />
                        <div
                          className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400"
                          style={{ backgroundColor: color }}
                        ></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Crear Grupo
                </button>
                <button
                  type="button"
                  onClick={() => setShowNuevoGrupo(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar foto */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Confirmar Eliminación</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                ¿Estás seguro de que deseas eliminar esta foto?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <img
                  src={showConfirmDelete.foto.url}
                  alt={showConfirmDelete.foto.nombre}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium text-gray-900">
                  {showConfirmDelete.foto.nombre}
                </p>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmarEliminarFoto}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Eliminar</span>
              </button>
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GaleriaFotos
