
import React, { useState, useEffect } from 'react'
import { usePosts } from '../hooks/usePosts'
import { useGruposFotos } from '../hooks/useGruposFotos'
import {Calendar, Clock, Instagram, Image, Hash, MapPin, Tag, Save, Send} from 'lucide-react'

interface EditorPostProps {
  post?: any
  fechaInicial?: Date
  onClose: () => void
  onSave: () => void
}

const EditorPost: React.FC<EditorPostProps> = ({ post, fechaInicial, onClose, onSave }) => {
  const { createPost, updatePost, programarInstagram } = usePosts()
  const { grupos } = useGruposFotos()
  
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    fechaProgramada: '',
    estado: 'borrador' as any,
    imagenes: [] as string[],
    grupoFotos: '',
    hashtags: [] as string[],
    instagramConfig: {
      caption: '',
      location: '',
      tags: [] as string[]
    }
  })

  const [hashtagInput, setHashtagInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [mostrarGaleria, setMostrarGaleria] = useState(false)

  useEffect(() => {
    if (post) {
      setFormData({
        titulo: post.titulo || '',
        contenido: post.contenido || '',
        fechaProgramada: post.fechaProgramada ? new Date(post.fechaProgramada).toISOString().slice(0, 16) : '',
        estado: post.estado || 'borrador',
        imagenes: post.imagenes || [],
        grupoFotos: post.grupoFotos || '',
        hashtags: post.hashtags || [],
        instagramConfig: post.instagramConfig || {
          caption: '',
          location: '',
          tags: []
        }
      })
    } else if (fechaInicial) {
      setFormData(prev => ({
        ...prev,
        fechaProgramada: fechaInicial.toISOString().slice(0, 16)
      }))
    }
  }, [post, fechaInicial])

  const handleSubmit = async (event: React.FormEvent, accion: 'guardar' | 'programar') => {
    event.preventDefault()
    
    try {
      const postData = {
        ...formData,
        fechaProgramada: new Date(formData.fechaProgramada).toISOString(),
        creator: 'admin'
      }

      if (post) {
        await updatePost(post._id, postData)
      } else {
        const nuevoPost = await createPost(postData)
        if (accion === 'programar') {
          await programarInstagram(nuevoPost._id)
        }
      }

      if (accion === 'programar' && post) {
        await programarInstagram(post._id)
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error al guardar post:', error)
    }
  }

  const agregarHashtag = () => {
    if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtagInput.trim()]
      }))
      setHashtagInput('')
    }
  }

  const eliminarHashtag = (hashtag: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(h => h !== hashtag)
    }))
  }

  const agregarTag = () => {
    if (tagInput.trim() && !formData.instagramConfig.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        instagramConfig: {
          ...prev.instagramConfig,
          tags: [...prev.instagramConfig.tags, tagInput.trim()]
        }
      }))
      setTagInput('')
    }
  }

  const eliminarTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      instagramConfig: {
        ...prev.instagramConfig,
        tags: prev.instagramConfig.tags.filter(t => t !== tag)
      }
    }))
  }

  const seleccionarFotosGrupo = (grupoId: string) => {
    const grupo = grupos.find(g => g._id === grupoId)
    if (grupo) {
      const urlsFotos = grupo.fotos.map(f => f.url)
      setFormData(prev => ({
        ...prev,
        imagenes: urlsFotos,
        grupoFotos: grupoId
      }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {post ? 'Editar Post' : 'Crear Nuevo Post'}
          </h2>

          <form onSubmit={(e) => handleSubmit(e, 'guardar')}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna izquierda - Contenido principal */}
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del Post
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Contenido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido
                  </label>
                  <textarea
                    value={formData.contenido}
                    onChange={(e) => setFormData(prev => ({ ...prev, contenido: e.target.value }))}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Fecha y hora programada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Fecha y Hora Programada
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fechaProgramada}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaProgramada: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value as any }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="programado">Programado</option>
                      <option value="publicado">Publicado</option>
                    </select>
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="inline w-4 h-4 mr-1" />
                    Hashtags
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      placeholder="Agregar hashtag"
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarHashtag())}
                    />
                    <button
                      type="button"
                      onClick={agregarHashtag}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Agregar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1"
                      >
                        <span>#{hashtag}</span>
                        <button
                          type="button"
                          onClick={() => eliminarHashtag(hashtag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna derecha - Configuración e imágenes */}
              <div className="space-y-4">
                {/* Seleccionar grupo de fotos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Image className="inline w-4 h-4 mr-1" />
                    Grupo de Fotos
                  </label>
                  <select
                    value={formData.grupoFotos}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, grupoFotos: e.target.value }))
                      if (e.target.value) {
                        seleccionarFotosGrupo(e.target.value)
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar grupo de fotos</option>
                    {grupos.map(grupo => (
                      <option key={grupo._id} value={grupo._id}>
                        {grupo.nombre} ({grupo.fotos.length} fotos)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preview de imágenes seleccionadas */}
                {formData.imagenes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imágenes Seleccionadas ({formData.imagenes.length})
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {formData.imagenes.slice(0, 6).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                      {formData.imagenes.length > 6 && (
                        <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm">
                          +{formData.imagenes.length - 6} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Configuración de Instagram */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                    Configuración de Instagram
                  </h3>

                  <div className="space-y-3">
                    {/* Caption */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caption
                      </label>
                      <textarea
                        value={formData.instagramConfig.caption}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instagramConfig: { ...prev.instagramConfig, caption: e.target.value }
                        }))}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Caption para Instagram..."
                      />
                    </div>

                    {/* Ubicación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        Ubicación
                      </label>
                      <input
                        type="text"
                        value={formData.instagramConfig.location}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instagramConfig: { ...prev.instagramConfig, location: e.target.value }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Ubicación..."
                      />
                    </div>

                    {/* Tags de Instagram */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Tag className="inline w-4 h-4 mr-1" />
                        Tags (@usuarios)
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="@usuario"
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarTag())}
                        />
                        <button
                          type="button"
                          onClick={agregarTag}
                          className="bg-pink-600 text-white px-3 py-2 rounded-md hover:bg-pink-700 text-sm"
                        >
                          Agregar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {formData.instagramConfig.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs flex items-center space-x-1"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => eliminarTag(tag)}
                              className="text-pink-600 hover:text-pink-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>Guardar</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'programar')}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Programar en Instagram</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditorPost
