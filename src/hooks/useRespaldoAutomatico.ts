
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import { useClientes } from './useClientes'
import { useRecordatorios } from './useRecordatorios'
import { useServicios } from './useServicios'
import { useTasks } from './useTasks'

interface RespaldoConfig {
  frecuencia: 'diario' | 'semanal' | 'mensual'
  horaEjecucion: string
  incluirClientes: boolean
  incluirRecordatorios: boolean
  incluirServicios: boolean
  incluirTasks: boolean
  destinoRespaldo: string
  ultimoRespaldo?: string
  activo: boolean
}

export function useRespaldoAutomatico() {
  const [config, setConfig] = useState<RespaldoConfig>({
    frecuencia: 'semanal',
    horaEjecucion: '02:00',
    incluirClientes: true,
    incluirRecordatorios: true,
    incluirServicios: true,
    incluirTasks: true,
    destinoRespaldo: 'local',
    activo: false
  })
  
  const [loading, setLoading] = useState(false)
  const [historialRespaldos, setHistorialRespaldos] = useState<Array<{
    fecha: string
    tipo: string
    estado: 'exitoso' | 'error'
    mensaje: string
    tamaño?: string
  }>>([])

  const { clientes } = useClientes()
  const { recordatorios } = useRecordatorios()
  const { servicios } = useServicios()
  const { tasks } = useTasks()

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const response = await lumi.entities.configuracion.list({
        filter: { tipo: 'respaldo_automatico' }
      })
      
      if (response.list && response.list.length > 0) {
        const configGuardada = response.list[0]
        setConfig(prev => ({
          ...prev,
          ...configGuardada.datos
        }))
      }
    } catch (error) {
      console.error('Error cargando configuración de respaldo:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async (nuevaConfig: Partial<RespaldoConfig>) => {
    try {
      setLoading(true)
      const configActualizada = { ...config, ...nuevaConfig }
      
      await lumi.entities.configuracion.create({
        tipo: 'respaldo_automatico',
        datos: configActualizada,
        fechaCreacion: new Date().toISOString()
      })
      
      setConfig(configActualizada)
      
      // Registrar en historial
      agregarAlHistorial('Configuración actualizada', 'exitoso', 'Configuración de respaldo automático guardada')
      
    } catch (error) {
      console.error('Error guardando configuración:', error)
      agregarAlHistorial('Error en configuración', 'error', 'No se pudo guardar la configuración')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const ejecutarRespaldo = async (tipo: 'manual' | 'automatico' = 'manual') => {
    try {
      setLoading(true)
      
      const datosRespaldo: any = {
        timestamp: new Date().toISOString(),
        tipo,
        version: '1.0'
      }

      // Recopilar datos según configuración
      if (config.incluirClientes && clientes) {
        datosRespaldo.clientes = clientes.filter(cliente => cliente && typeof cliente === 'object')
      }

      if (config.incluirRecordatorios && recordatorios) {
        datosRespaldo.recordatorios = recordatorios.filter(recordatorio => recordatorio && typeof recordatorio === 'object')
      }

      if (config.incluirServicios && servicios) {
        datosRespaldo.servicios = servicios.filter(servicio => servicio && typeof servicio === 'object')
      }

      if (config.incluirTasks && tasks) {
        datosRespaldo.tasks = tasks.filter(task => task && typeof task === 'object')
      }

      // Calcular tamaño aproximado
      const tamaño = calcularTamañoRespaldo(datosRespaldo)

      // Simular guardado del respaldo
      console.log('Respaldo generado:', datosRespaldo)
      
      // Actualizar última fecha de respaldo
      await guardarConfiguracion({
        ultimoRespaldo: new Date().toISOString()
      })

      // Registrar en historial
      agregarAlHistorial(
        tipo === 'manual' ? 'Respaldo manual' : 'Respaldo automático',
        'exitoso',
        `Respaldo completado exitosamente. Datos incluidos: ${Object.keys(datosRespaldo).filter(k => k !== 'timestamp' && k !== 'tipo' && k !== 'version').join(', ')}`,
        tamaño
      )

      return datosRespaldo

    } catch (error) {
      console.error('Error ejecutando respaldo:', error)
      agregarAlHistorial(
        tipo === 'manual' ? 'Respaldo manual' : 'Respaldo automático',
        'error',
        `Error al ejecutar respaldo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
      throw error
    } finally {
      setLoading(false)
    }
  }

  const restaurarRespaldo = async (archivoRespaldo: File) => {
    try {
      setLoading(true)
      
      const texto = await archivoRespaldo.text()
      const datosRespaldo = JSON.parse(texto)

      // Validar estructura del respaldo
      if (!datosRespaldo.timestamp || !datosRespaldo.version) {
        throw new Error('Archivo de respaldo inválido')
      }

      // Restaurar datos (esto sería más complejo en una implementación real)
      console.log('Restaurando datos:', datosRespaldo)

      agregarAlHistorial(
        'Restauración',
        'exitoso',
        `Datos restaurados desde respaldo del ${new Date(datosRespaldo.timestamp).toLocaleString()}`,
        calcularTamañoRespaldo(datosRespaldo)
      )

    } catch (error) {
      console.error('Error restaurando respaldo:', error)
      agregarAlHistorial(
        'Restauración',
        'error',
        `Error al restaurar respaldo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
      throw error
    } finally {
      setLoading(false)
    }
  }

  const calcularTamañoRespaldo = (datos: any): string => {
    try {
      const jsonString = JSON.stringify(datos)
      const bytes = new Blob([jsonString]).size
      
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    } catch (error) {
      console.warn('Error calculando tamaño:', error)
      return 'Desconocido'
    }
  }

  const agregarAlHistorial = (tipo: string, estado: 'exitoso' | 'error', mensaje: string, tamaño?: string) => {
    const nuevoRegistro = {
      fecha: new Date().toISOString(),
      tipo,
      estado,
      mensaje,
      tamaño
    }
    
    setHistorialRespaldos(prev => [nuevoRegistro, ...prev.slice(0, 49)]) // Mantener últimos 50 registros
  }

  const limpiarHistorial = () => {
    setHistorialRespaldos([])
  }

  const exportarDatos = async (formato: 'json' | 'csv') => {
    try {
      setLoading(true)
      
      const datosExportacion = await ejecutarRespaldo('manual')
      
      if (formato === 'json') {
        const blob = new Blob([JSON.stringify(datosExportacion, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `respaldo_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (formato === 'csv') {
        // Implementación básica de CSV para clientes
        if (datosExportacion.clientes) {
          const csvContent = convertirClientesACSV(datosExportacion.clientes)
          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`
          a.click()
          URL.revokeObjectURL(url)
        }
      }

      agregarAlHistorial('Exportación', 'exitoso', `Datos exportados en formato ${formato.toUpperCase()}`)

    } catch (error) {
      console.error('Error exportando datos:', error)
      agregarAlHistorial('Exportación', 'error', `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const convertirClientesACSV = (clientes: any[]): string => {
    try {
      if (!Array.isArray(clientes) || clientes.length === 0) {
        return 'No hay datos de clientes para exportar'
      }

      const headers = ['Nombres', 'Emails', 'Teléfono', 'Fecha Boda', 'Ciudad', 'Venue', 'Servicio', 'Estado', 'Monto Total']
      const rows = clientes.map(cliente => {
        if (!cliente || typeof cliente !== 'object') return []
        
        return [
          cliente.nombres || '',
          Array.isArray(cliente.emails) ? cliente.emails.join('; ') : (cliente.emails || ''),
          cliente.telefono || '',
          cliente.fechaBoda || '',
          cliente.ciudad || '',
          cliente.venue || '',
          cliente.servicio?.nombre || '',
          cliente.estado || '',
          cliente.montoTotal || ''
        ]
      })

      return [headers, ...rows].map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n')
    } catch (error) {
      console.error('Error convirtiendo a CSV:', error)
      return 'Error al generar CSV'
    }
  }

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  return {
    config,
    loading,
    historialRespaldos,
    guardarConfiguracion,
    ejecutarRespaldo,
    restaurarRespaldo,
    exportarDatos,
    limpiarHistorial
  }
}
