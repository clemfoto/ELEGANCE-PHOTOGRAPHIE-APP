
import React, { useState } from 'react'
import { usePosts } from '../hooks/usePosts'
import {Calendar, Clock, Instagram, Edit, Trash2, Plus} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface CalendarioPostsProps {
  onEditPost: (post: any) => void
  onNewPost: (fecha: Date) => void
}

const CalendarioPosts: React.FC<CalendarioPostsProps> = ({ onEditPost, onNewPost }) => {
  const { posts, deletePost, programarInstagram } = usePosts()
  const [fechaActual, setFechaActual] = useState(new Date())
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  // Generar días del mes
  const inicioMes = startOfMonth(fechaActual)
  const finMes = endOfMonth(fechaActual)
  const diasMes = eachDayOfInterval({ start: inicioMes, end: finMes })

  // Filtrar posts por fecha y estado
  const getPostsDelDia = (fecha: Date) => {
    return posts.filter(post => {
      const fechaPost = new Date(post.fechaProgramada)
      const cumpleFecha = isSameDay(fechaPost, fecha)
      const cumpleEstado = filtroEstado === 'todos' || post.estado === filtroEstado
      return cumpleFecha && cumpleEstado
    })
  }

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-500'
      case 'programado': return 'bg-blue-500'
      case 'publicado': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const navegarMes = (direccion: number) => {
    const nuevaFecha = new Date(fechaActual)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion)
    setFechaActual(nuevaFecha)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Calendario de Posts
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Filtro por estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="borrador">Borradores</option>
            <option value="programado">Programados</option>
            <option value="publicado">Publicados</option>
            <option value="error">Con errores</option>
          </select>

          {/* Navegación de mes */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navegarMes(-1)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              ←
            </button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {format(fechaActual, 'MMMM yyyy', { locale: es })}
            </span>
            <button
              onClick={() => navegarMes(1)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="flex items-center space-x-4 mb-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span>Borrador</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Programado</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Publicado</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Error</span>
        </div>
      </div>

      {/* Grid del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {/* Días de la semana */}
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
          <div key={dia} className="p-2 text-center font-semibold text-gray-600 border-b">
            {dia}
          </div>
        ))}

        {/* Días del mes */}
        {diasMes.map(dia => {
          const postsDelDia = getPostsDelDia(dia)
          const esHoy = isSameDay(dia, new Date())
          const esMesActual = isSameMonth(dia, fechaActual)

          return (
            <div
              key={dia.toISOString()}
              className={`min-h-[120px] p-2 border border-gray-200 ${
                esHoy ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              } ${!esMesActual ? 'text-gray-400 bg-gray-50' : ''}`}
            >
              {/* Número del día */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${esHoy ? 'text-blue-600' : ''}`}>
                  {format(dia, 'd')}
                </span>
                
                {/* Botón para agregar post */}
                <button
                  onClick={() => onNewPost(dia)}
                  className="w-5 h-5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded flex items-center justify-center"
                  title="Agregar post"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Posts del día */}
              <div className="space-y-1">
                {postsDelDia.map(post => (
                  <div
                    key={post._id}
                    className={`text-xs p-1 rounded cursor-pointer ${getColorEstado(post.estado)} text-white`}
                    onClick={() => onEditPost(post)}
                    title={post.titulo}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">
                        {post.titulo}
                      </span>
                      <div className="flex items-center space-x-1 ml-1">
                        <Clock size={10} />
                        <span>
                          {format(new Date(post.fechaProgramada), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Acciones rápidas */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        {post.imagenes.length > 0 && (
                          <span className="text-[10px]">📷 {post.imagenes.length}</span>
                        )}
                        {post.hashtags.length > 0 && (
                          <span className="text-[10px]"># {post.hashtags.length}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {post.estado === 'borrador' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              programarInstagram(post._id)
                            }}
                            className="hover:bg-white hover:bg-opacity-20 p-0.5 rounded"
                            title="Programar en Instagram"
                          >
                            <Instagram size={10} />
                          </button>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditPost(post)
                          }}
                          className="hover:bg-white hover:bg-opacity-20 p-0.5 rounded"
                          title="Editar"
                        >
                          <Edit size={10} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('¿Eliminar este post?')) {
                              deletePost(post._id)
                            }
                          }}
                          className="hover:bg-white hover:bg-opacity-20 p-0.5 rounded"
                          title="Eliminar"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarioPosts
