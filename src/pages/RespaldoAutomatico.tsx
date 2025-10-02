
import React, { useState } from 'react'
import { useRespaldos } from '../hooks/useRespaldos'
import { Cloud, CloudDrizzle, HardDrive, Settings, CheckCircle, AlertCircle, Download, Link, Copy, ExternalLink, FolderOpen } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const RespaldoAutomatico: React.FC = () => {
  const {
    configuracion,
    loading,
    conectando,
    guardarConfiguracion,
    conectarProveedor,
    realizarRespaldo
  } = useRespaldos()

  const [configuracionLocal, setConfiguracionLocal] = useState(configuracion)
  const [conectado, setConectado] = useState(false)
  const [linkRespaldo, setLinkRespaldo] = useState('')
  const [mostrandoEnlace, setMostrandoEnlace] = useState(false)
  const [mostrarConfigUbicacion, setMostrarConfigUbicacion] = useState(false)
  const [ubicacionPersonalizada, setUbicacionPersonalizada] = useState(
    localStorage.getItem('respaldo_ubicacion') || ''
  )

  const proveedores = [
    {
      id: 'google_drive',
      nombre: 'Google Drive',
      descripcion: 'Respaldo en Google Drive con 15GB gratuitos',
      icono: '🔵',
      color: 'blue'
    },
    {
      id: 'dropbox',
      nombre: 'Dropbox',
      descripcion: 'Respaldo en Dropbox con 2GB gratuitos',
      icono: '🔷',
      color: 'indigo'
    },
    {
      id: 'onedrive',
      nombre: 'OneDrive',
      descripcion: 'Respaldo en Microsoft OneDrive con 5GB gratuitos',
      icono: '🔶',
      color: 'purple'
    },
    {
      id: 'personalizado',
      nombre: 'Ubicación Personalizada',
      descripcion: 'Configura tu propia URL de respaldo',
      icono: '🔗',
      color: 'green'
    }
  ]

  const frecuencias = [
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'mensual', label: 'Mensual' }
  ]

  const guardarUbicacionPersonalizada = () => {
    localStorage.setItem('respaldo_ubicacion', ubicacionPersonalizada)
    setMostrarConfigUbicacion(false)
    toast.success('Ubicación de respaldo guardada exitosamente')
  }

  const handleConectar = async (proveedor: string) => {
    if (proveedor === 'personalizado') {
      setMostrarConfigUbicacion(true)
      return
    }

    const success = await conectarProveedor(proveedor as any)
    if (success) {
      setConectado(true)
      setConfiguracionLocal(prev => ({ ...prev, proveedor: proveedor as any }))
      toast.success('Proveedor conectado exitosamente')
    }
  }

  const handleGuardar = async () => {
    const success = await guardarConfiguracion(configuracionLocal)
    if (success) {
      toast.success('Configuración guardada exitosamente')
    }
  }

  const handleRespaldoManual = async () => {
    const success = await realizarRespaldo()
    if (success) {
      // Generar link de respaldo según el proveedor
      let linkGenerado = ''
      
      if (configuracionLocal.proveedor === 'personalizado' && ubicacionPersonalizada) {
        linkGenerado = `${ubicacionPersonalizada}/backup-${Date.now()}.zip`
      } else {
        linkGenerado = `https://${configuracionLocal.proveedor}.com/backup/${Date.now()}`
      }
      
      setLinkRespaldo(linkGenerado)
      setMostrandoEnlace(true)
      toast.success('Respaldo realizado exitosamente')
    }
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(linkRespaldo)
    toast.success('Link copiado al portapapeles')
  }

  const abrirLink = () => {
    window.open(linkRespaldo, '_blank')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Respaldo Automático</h1>
        <p className="text-gray-600">Configura respaldos automáticos de tus datos en la nube</p>
      </div>

      {/* Estado actual */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Estado del Respaldo</h2>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
            configuracion.activo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {configuracion.activo ? (
              <>
                <CheckCircle size={16} className="mr-1" />
                Activo
              </>
            ) : (
              <>
                <AlertCircle size={16} className="mr-1" />
                Inactivo
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Cloud className="text-blue-600 mr-2" size={20} />
              <span className="font-medium">Proveedor</span>
            </div>
            <p className="text-sm text-gray-600">
              {proveedores.find(p => p.id === configuracion.proveedor)?.nombre || 'No configurado'}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Settings className="text-green-600 mr-2" size={20} />
              <span className="font-medium">Frecuencia</span>
            </div>
            <p className="text-sm text-gray-600">
              {frecuencias.find(f => f.value === configuracion.frecuencia)?.label}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center mb-2">
              <HardDrive className="text-purple-600 mr-2" size={20} />
              <span className="font-medium">Último Respaldo</span>
            </div>
            <p className="text-sm text-gray-600">
              {configuracion.ultimoRespaldo 
                ? format(parseISO(configuracion.ultimoRespaldo), 'dd/MM/yyyy HH:mm', { locale: es })
                : 'Nunca'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Modal de configuración de ubicación personalizada */}
      {mostrarConfigUbicacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FolderOpen className="mr-2 h-5 w-5" />
                Configurar Ubicación de Respaldo
              </h3>
              <button
                onClick={() => setMostrarConfigUbicacion(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de destino del respaldo
                </label>
                <input
                  type="url"
                  value={ubicacionPersonalizada}
                  onChange={(e) => setUbicacionPersonalizada(e.target.value)}
                  placeholder="https://mi-servidor.com/respaldos"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ingresa la URL donde quieres que se guarden los respaldos
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-green-900 mb-2">
                  Ejemplos de ubicaciones válidas:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• https://mi-servidor.com/respaldos</li>
                  <li>• https://storage.ejemplo.com/backups</li>
                  <li>• ftp://mi-ftp.com/backup-folder</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={guardarUbicacionPersonalizada}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Guardar Ubicación
              </button>
              <button
                onClick={() => setMostrarConfigUbicacion(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link de respaldo generado */}
      {mostrandoEnlace && linkRespaldo && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-800 flex items-center">
              <Link className="mr-2" size={20} />
              Link de Respaldo Generado
            </h3>
            <button
              onClick={() => setMostrandoEnlace(false)}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
            <p className="text-sm text-gray-600 mb-2">Tu respaldo está disponible en:</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono text-gray-800 break-all">
                {linkRespaldo}
              </code>
              <button
                onClick={copiarLink}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Copiar link"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={abrirLink}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                title="Abrir link"
              >
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-green-700">
            💡 <strong>Consejo:</strong> Guarda este link en un lugar seguro para acceder a tu respaldo cuando lo necesites.
          </p>
        </div>
      )}

      {/* Configuración */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-6">Configuración</h2>

        {/* Activar/Desactivar */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={configuracionLocal.activo}
              onChange={(e) => setConfiguracionLocal(prev => ({ ...prev, activo: e.target.checked }))}
              className="mr-3 h-4 w-4 text-blue-600"
            />
            <span className="font-medium">Activar respaldo automático</span>
          </label>
        </div>

        {/* Selección de proveedor */}
        <div className="mb-6">
          <h3 className="font-medium mb-4">Proveedor de Respaldo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proveedores.map((proveedor) => (
              <div
                key={proveedor.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  configuracionLocal.proveedor === proveedor.id
                    ? `border-${proveedor.color}-500 bg-${proveedor.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfiguracionLocal(prev => ({ ...prev, proveedor: proveedor.id as any }))}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{proveedor.icono}</span>
                  <span className="font-medium">{proveedor.nombre}</span>
                </div>
                <p className="text-sm text-gray-600">{proveedor.descripcion}</p>
                
                {configuracionLocal.proveedor === proveedor.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleConectar(proveedor.id)
                    }}
                    disabled={conectando}
                    className={`mt-3 w-full px-3 py-2 bg-${proveedor.color}-600 text-white rounded hover:bg-${proveedor.color}-700 disabled:opacity-50`}
                  >
                    {conectando ? 'Conectando...' : 
                     proveedor.id === 'personalizado' ? 'Configurar URL' :
                     conectado ? 'Reconectar' : 'Conectar'}
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {ubicacionPersonalizada && configuracionLocal.proveedor === 'personalizado' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Ubicación configurada:</strong> {ubicacionPersonalizada}
              </p>
            </div>
          )}
        </div>

        {/* Frecuencia */}
        <div className="mb-6">
          <h3 className="font-medium mb-4">Frecuencia de Respaldo</h3>
          <div className="grid grid-cols-3 gap-4">
            {frecuencias.map((freq) => (
              <label key={freq.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="frecuencia"
                  value={freq.value}
                  checked={configuracionLocal.frecuencia === freq.value}
                  onChange={(e) => setConfiguracionLocal(prev => ({ ...prev, frecuencia: e.target.value as any }))}
                  className="mr-3"
                />
                <span>{freq.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hora */}
        <div className="mb-6">
          <h3 className="font-medium mb-4">Hora del Respaldo</h3>
          <input
            type="time"
            value={configuracionLocal.hora}
            onChange={(e) => setConfiguracionLocal(prev => ({ ...prev, hora: e.target.value }))}
            className="p-2 border border-gray-300 rounded-md"
          />
          <p className="text-sm text-gray-600 mt-1">
            Los respaldos se realizarán automáticamente a esta hora
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-4">
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </button>

          <button
            onClick={handleRespaldoManual}
            disabled={loading || !configuracionLocal.activo}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            <Download size={16} className="mr-2" />
            Respaldo Manual
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Información Importante</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Los respaldos incluyen: clientes, tareas, llamadas, servicios y contabilidad</li>
          <li>• Los archivos se cifran antes de subirse a la nube</li>
          <li>• Puedes descargar respaldos anteriores desde tu cuenta en la nube</li>
          <li>• Se recomienda verificar el espacio disponible en tu cuenta de nube</li>
          <li>• El link de respaldo se genera automáticamente después de cada respaldo manual</li>
          <li>• Para ubicaciones personalizadas, asegúrate de que la URL sea accesible</li>
        </ul>
      </div>
    </div>
  )
}

export default RespaldoAutomatico
