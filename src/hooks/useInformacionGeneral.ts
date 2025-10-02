
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'

export interface InformacionGeneral {
  _id: string
  titulo: string
  descripcion: string
  fechaCreacion: string
  fechaModificacion: string
}

export const useInformacionGeneral = () => {
  const [informaciones, setInformaciones] = useState<InformacionGeneral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarInformaciones = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Iniciando carga de informaciones...')
      
      // Verificar que lumi está disponible
      if (!lumi) {
        throw new Error('SDK Lumi no está disponible')
      }
      
      console.log('✅ SDK Lumi disponible:', !!lumi)
      console.log('✅ Entidades disponibles:', Object.keys(lumi.entities || {}))
      
      // Verificar que la entidad existe
      if (!lumi.entities.informacion_general) {
        console.error('❌ Entidad informacion_general no encontrada')
        console.log('Entidades disponibles:', Object.keys(lumi.entities))
        throw new Error('Entidad informacion_general no está configurada')
      }
      
      console.log('✅ Entidad informacion_general encontrada')
      
      // Intentar cargar datos
      const response = await lumi.entities.informacion_general.list()
      console.log('📊 === ANÁLISIS DETALLADO DE RESPUESTA ===')
      console.log('📊 Respuesta completa:', response)
      console.log('📊 Tipo de respuesta:', typeof response)
      console.log('📊 Es array:', Array.isArray(response))
      console.log('📊 Constructor:', response?.constructor?.name)
      
      // Si es objeto, analizar sus propiedades
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        console.log('📊 Propiedades del objeto:', Object.keys(response))
        console.log('📊 Valores del objeto:', Object.values(response))
        
        // Analizar cada propiedad
        Object.keys(response).forEach(key => {
          const value = response[key]
          console.log(`📊 ${key}:`, typeof value, Array.isArray(value), value)
        })
      }
      
      // 🔧 MÚLTIPLES ESTRATEGIAS DE EXTRACCIÓN
      let data: InformacionGeneral[] = []
      
      if (Array.isArray(response)) {
        // Estrategia 1: Array directo
        data = response
        console.log('✅ Estrategia 1: Array directo')
      } else if (response && typeof response === 'object') {
        // Estrategia 2: Buscar en propiedades conocidas
        const possibleArrays = ['data', 'items', 'results', 'records', 'docs', 'documents']
        
        for (const prop of possibleArrays) {
          if (Array.isArray(response[prop])) {
            data = response[prop]
            console.log(`✅ Estrategia 2: Datos encontrados en response.${prop}`)
            break
          }
        }
        
        // Estrategia 3: Si no encontramos arrays, buscar objetos que parezcan registros
        if (data.length === 0) {
          const keys = Object.keys(response)
          console.log('🔍 Analizando claves para encontrar registros...')
          
          // Buscar objetos que tengan _id (parecen registros de MongoDB)
          const possibleRecords = keys.filter(key => {
            const value = response[key]
            return value && typeof value === 'object' && value._id
          })
          
          if (possibleRecords.length > 0) {
            data = possibleRecords.map(key => response[key])
            console.log('✅ Estrategia 3: Convertidos objetos con _id a array')
          } else {
            // Estrategia 4: Convertir todo el objeto a array si parece ser un registro único
            if (response._id) {
              data = [response]
              console.log('✅ Estrategia 4: Objeto único convertido a array')
            }
          }
        }
        
        // Estrategia 5: Buscar cualquier array en el objeto
        if (data.length === 0) {
          const arrays = Object.values(response).filter(value => Array.isArray(value))
          if (arrays.length > 0) {
            data = arrays[0] as InformacionGeneral[]
            console.log('✅ Estrategia 5: Primer array encontrado en el objeto')
          }
        }
      }
      
      console.log('📊 === RESULTADO FINAL ===')
      console.log('📊 Datos extraídos:', data)
      console.log('📊 Cantidad de elementos:', data.length)
      console.log('📊 Primer elemento:', data[0])
      console.log('📊 Estructura del primer elemento:', data[0] ? Object.keys(data[0]) : 'No hay elementos')
      
      setInformaciones(data)
      console.log('✅ Estado actualizado con', data.length, 'elementos')
      
    } catch (error: any) {
      console.error('❌ Error completo al cargar:', error)
      console.error('❌ Stack trace:', error.stack)
      setError(error.message)
      setInformaciones([])
    } finally {
      setLoading(false)
    }
  }

  const crearInformacion = async (informacion: Omit<InformacionGeneral, '_id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    try {
      console.log('🆕 === INICIANDO CREACIÓN DE INFORMACIÓN ===')
      console.log('📝 Datos recibidos:', informacion)
      
      // Validaciones básicas
      if (!informacion.titulo || !informacion.titulo.trim()) {
        throw new Error('El título es obligatorio')
      }
      
      // Verificar SDK
      if (!lumi || !lumi.entities || !lumi.entities.informacion_general) {
        console.error('❌ SDK o entidad no disponible')
        throw new Error('Sistema no disponible')
      }
      
      console.log('✅ SDK y entidad verificados')
      
      // Preparar datos
      const now = new Date().toISOString()
      const datosParaCrear = {
        titulo: informacion.titulo.trim(),
        descripcion: informacion.descripcion?.trim() || '',
        fechaCreacion: now,
        fechaModificacion: now
      }
      
      console.log('📦 Datos preparados para envío:', datosParaCrear)
      console.log('📦 Tipos de datos:')
      Object.entries(datosParaCrear).forEach(([key, value]) => {
        console.log(`  ${key}: ${typeof value} = "${value}"`)
      })
      
      // Intentar crear
      console.log('🚀 Llamando a lumi.entities.informacion_general.create...')
      
      const resultado = await lumi.entities.informacion_general.create(datosParaCrear)
      
      console.log('✅ Resultado de creación:', resultado)
      console.log('✅ Tipo de resultado:', typeof resultado)
      console.log('✅ ID generado:', resultado?._id)
      
      if (!resultado) {
        throw new Error('No se recibió respuesta del servidor')
      }
      
      // Recargar datos inmediatamente sin delay
      console.log('🔄 Recargando lista...')
      await cargarInformaciones()
      
      console.log('✅ === CREACIÓN COMPLETADA EXITOSAMENTE ===')
      return resultado
      
    } catch (error: any) {
      console.error('❌ === ERROR EN CREACIÓN ===')
      console.error('❌ Error:', error)
      throw new Error(`Error al crear información: ${error.message}`)
    }
  }

  const actualizarInformacion = async (id: string, updates: Partial<Omit<InformacionGeneral, '_id' | 'fechaCreacion'>>) => {
    try {
      console.log('✏️ Actualizando información:', id, updates)
      
      if (!id) {
        throw new Error('ID requerido para actualizar')
      }
      
      const datosActualizados = {
        ...updates,
        fechaModificacion: new Date().toISOString()
      }
      
      console.log('📦 Datos para actualizar:', datosActualizados)
      
      const resultado = await lumi.entities.informacion_general.update(id, datosActualizados)
      console.log('✅ Resultado de actualización:', resultado)
      
      await cargarInformaciones()
      
      return resultado
      
    } catch (error: any) {
      console.error('❌ Error al actualizar:', error)
      throw new Error(`Error al actualizar: ${error.message}`)
    }
  }

  const eliminarInformacion = async (id: string) => {
    try {
      console.log('🗑️ Eliminando información:', id)
      
      if (!id) {
        throw new Error('ID requerido para eliminar')
      }
      
      const resultado = await lumi.entities.informacion_general.delete(id)
      console.log('✅ Resultado de eliminación:', resultado)
      
      await cargarInformaciones()
      
      return resultado
      
    } catch (error: any) {
      console.error('❌ Error al eliminar:', error)
      throw new Error(`Error al eliminar: ${error.message}`)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('🎯 Hook montado, cargando datos...')
    cargarInformaciones()
  }, [])

  // Debug del estado
  useEffect(() => {
    console.log('📊 Estado actual del hook:')
    console.log('  - Loading:', loading)
    console.log('  - Error:', error)
    console.log('  - Informaciones count:', informaciones.length)
    console.log('  - Informaciones:', informaciones)
  }, [loading, error, informaciones])

  return {
    informaciones,
    loading,
    error,
    cargarInformaciones,
    crearInformacion,
    actualizarInformacion,
    eliminarInformacion
  }
}
