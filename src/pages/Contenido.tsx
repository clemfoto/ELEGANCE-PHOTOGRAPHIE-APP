
import React, { useState } from 'react'
import CalendarioPosts from '../components/CalendarioPosts'
import GaleriaFotos from '../components/GaleriaFotos'
import EditorPost from '../components/EditorPost'
import { usePosts } from '../hooks/usePosts'
import {Calendar, Image, Instagram, BarChart3, Plus} from 'lucide-react'

const Contenido: React.FC = () => {
  const { posts, getPostsByEstado } = usePosts()
  const [tabActiva, setTabActiva] = useState<'calendario' | 'galeria' | 'estadisticas'>('calendario')
  const [showEditor, setShowEditor] = useState(false)
  const [postEditando, setPostEditando] = useState<any>(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<string[]>([])

  const tabs = [
    {
      id: 'calendario' as const,
      label: 'Calendario de Posts',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 'galeria' as const,
      label: 'Galería de Fotos',
      icon: Image,
      color: 'purple'
    },
    {
      id: 'estadisticas' as const,
      label: 'Estadísticas',
      icon: BarChart3,
      color: 'green'
    }
  ]

  const handleEditPost = (post: any) => {
    setPostEditando(post)
    setShowEditor(true)
  }

  const handleNewPost = (fecha: Date) => {
    setFechaSeleccionada(fecha)
    setPostEditando(null)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setPostEditando(null)
    setFechaSeleccionada(null)
  }

  const handleSavePost = () => {
    // Refrescar datos si es necesario
  }

  const estadisticas = {
    totalPosts: posts.length,
    borradores: getPostsByEstado('borrador').length,
    programados: getPostsByEstado('programado').length,
    publicados: getPostsByEstado('publicado').length,
    errores: getPostsByEstado('error').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Contenido</h1>
          <p className="text-gray-600 mt-2">
            Organiza tus posts, fotos y programa publicaciones automáticas en Instagram
          </p>
        </div>

        <button
          onClick={() => handleNewPost(new Date())}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 shadow-lg"
        >
          <Plus size={20} />
          <span>Nuevo Post</span>
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalPosts}</p>
            </div>
            <Instagram className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Borradores</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.borradores}</p>
            </div>
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Programados</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.programados}</p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.publicados}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Errores</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.errores}</p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tabActiva === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? `border-${tab.color}-500 text-${tab.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5 transition-colors
                    ${isActive ? `text-${tab.color}-500` : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="mt-6">
        {tabActiva === 'calendario' && (
          <CalendarioPosts
            onEditPost={handleEditPost}
            onNewPost={handleNewPost}
          />
        )}

        {tabActiva === 'galeria' && (
          <GaleriaFotos
            onSelectFotos={setFotosSeleccionadas}
            selectedFotos={fotosSeleccionadas}
          />
        )}

        {tabActiva === 'estadisticas' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas de Instagram</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Gráfico de posts por estado */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts por Estado</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Borradores</span>
                    </div>
                    <span className="font-semibold">{estadisticas.borradores}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Programados</span>
                    </div>
                    <span className="font-semibold">{estadisticas.programados}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Publicados</span>
                    </div>
                    <span className="font-semibold">{estadisticas.publicados}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Con Errores</span>
                    </div>
                    <span className="font-semibold">{estadisticas.errores}</span>
                  </div>
                </div>
              </div>

              {/* Integración con Instagram */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                  Integración Instagram
                </h3>
                <div className="space-y-3">
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                    <p className="text-sm text-pink-800 font-medium">Estado: Conectado</p>
                    <p className="text-xs text-pink-600 mt-1">
                      Cuenta: @wedding_manager_oficial
                    </p>
                  </div>
                  
                  <button className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 text-sm">
                    Configurar API Instagram
                  </button>
                  
                  <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 text-sm">
                    Ver Métricas Detalladas
                  </button>
                </div>
              </div>

              {/* Próximas publicaciones */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximas Publicaciones</h3>
                <div className="space-y-3">
                  {getPostsByEstado('programado').slice(0, 3).map((post, index) => (
                    <div key={post._id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 truncate">
                        {post.titulo}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {new Date(post.fechaProgramada).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                  
                  {getPostsByEstado('programado').length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No hay publicaciones programadas
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Información de integración */}
            <div className="mt-8 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Instagram className="w-5 h-5 mr-2 text-pink-600" />
                Automatización de Instagram
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Funcionalidades Disponibles:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Programación automática de posts</li>
                    <li>✅ Subida de múltiples imágenes</li>
                    <li>✅ Gestión de hashtags y ubicaciones</li>
                    <li>✅ Etiquetado de usuarios</li>
                    <li>🔄 Métricas y analytics (próximamente)</li>
                    <li>🔄 Stories automáticas (próximamente)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Configuración:</h4>
                  <div className="space-y-2">
                    <button className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 text-sm">
                      Conectar con Instagram Business
                    </button>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm">
                      Configurar Webhooks
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      * Requiere cuenta Instagram Business y aprobación de Meta
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor de Posts Modal */}
      {showEditor && (
        <EditorPost
          post={postEditando}
          fechaInicial={fechaSeleccionada}
          onClose={handleCloseEditor}
          onSave={handleSavePost}
        />
      )}
    </div>
  )
}

export default Contenido
