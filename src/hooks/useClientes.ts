
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import { isValidDate, safeFormatDate } from '../utils/dateUtils'

export type Divisa = 'EUR' | 'MXN' | 'USD' | 'CAD'

export interface Invitado {
  id: string
  nombre: string
  tachado: boolean
  fechaAgregado: string
  fechaTachado?: string
}

export interface Cliente {
  _id?: string
  nombres: string
  emails: string[] // Cambiado a array para múltiples correos
  telefono?: string
  fechaBoda: string
  ciudad: string
  venue: string
  servicio: {
    tipo: 'fotografia' | 'video' | 'fotografia_video' | 'album' | 'paquete_completo' | 'personalizado'
    servicioId?: string // ID del servicio predefinido
    descripcionPersonalizada?: string // Descripción personalizada
    nombre: string // Nombre del servicio
    precio?: number
  }
  divisa: Divisa
  formaPago: 'efectivo' | 'transferencia' | 'tarjeta' | 'financiado' | 'mixto'
  detallesPago?: {
    cuotas?: Array<{
      monto: number
      fechaPago: string
      metodoPago: string
      estado: 'pendiente' | 'pagado' | 'vencido'
      concepto: string
      comprobante?: string
    }>
    descuentos?: number
    impuestos?: number
  }
  montoTotal?: number
  montoAbonado?: number
  proximoPago?: {
    monto: number
    fechaVencimiento: string
    metodoPago: string
  }
  estado: 'potencial' | 'confirmado' | 'en_proceso' | 'completado' | 'cancelado'
  solicitudesEspeciales?: string
  archivoExcel?: string
  notas?: string
  // Nueva funcionalidad de lista de invitados
  listaInvitados?: Invitado[]
  recordatorios?: Array<{
    fecha: string
    tipo: string
    mensaje: string
  }>
  alertasConfiguradas?: {
    alertaSieteDias: boolean
    alertaPago: boolean
    notificacionCelular: boolean
  }
  sincronizadoOutlook?: boolean // Para tracking de sincronización
  outlookEventId?: string // ID del evento en Outlook
  createdAt?: string
  updatedAt?: string
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadClientes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await lumi.entities.clientes.list({
        sort: { fechaBoda: 1 }
      })
      
      const validClientes = (response.list || []).filter((cliente: any) => {
        // Validaciones defensivas
        if (!cliente || typeof cliente !== 'object') {
          console.warn('Cliente inválido encontrado:', cliente)
          return false
        }

        if (!cliente.nombres || typeof cliente.nombres !== 'string') {
          console.warn('Cliente sin nombres válidos:', cliente)
          return false
        }
        
        if (!cliente.fechaBoda || typeof cliente.fechaBoda !== 'string') {
          console.warn('Cliente sin fecha de boda:', cliente.nombres)
          return false
        }
        
        if (!isValidDate(cliente.fechaBoda)) {
          console.warn('Cliente con fecha inválida:', cliente.nombres, cliente.fechaBoda)
          return false
        }

        // Validar emails como array
        if (!Array.isArray(cliente.emails)) {
          if (typeof cliente.emails === 'string') {
            cliente.emails = [cliente.emails]
          } else {
            cliente.emails = []
          }
        }

        // Validar lista de invitados
        if (!Array.isArray(cliente.listaInvitados)) {
          cliente.listaInvitados = []
        }

        // Validar campos de texto
        cliente.ciudad = cliente.ciudad || ''
        cliente.venue = cliente.venue || ''
        cliente.telefono = cliente.telefono || ''
        
        return true
      })
      
      setClientes(validClientes)
    } catch (err: any) {
      console.error('Error loading clientes:', err)
      setError('Error al cargar los clientes')
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  const addCliente = async (clienteData: Omit<Cliente, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Validaciones defensivas
      if (!clienteData || typeof clienteData !== 'object') {
        throw new Error('Datos del cliente inválidos')
      }

      if (!clienteData.nombres || typeof clienteData.nombres !== 'string') {
        throw new Error('El nombre del cliente es requerido')
      }

      if (!clienteData.fechaBoda || !isValidDate(clienteData.fechaBoda)) {
        throw new Error('La fecha de boda no es válida')
      }

      // Asegurar que emails sea un array válido
      const emailsValidos = Array.isArray(clienteData.emails) 
        ? clienteData.emails.filter(email => email && typeof email === 'string' && email.trim())
        : []

      if (emailsValidos.length === 0) {
        throw new Error('Al menos un email válido es requerido')
      }
      
      const newCliente = {
        ...clienteData,
        emails: emailsValidos,
        ciudad: clienteData.ciudad || '',
        venue: clienteData.venue || '',
        telefono: clienteData.telefono || '',
        solicitudesEspeciales: clienteData.solicitudesEspeciales || '',
        notas: clienteData.notas || '',
        archivoExcel: clienteData.archivoExcel || '',
        listaInvitados: clienteData.listaInvitados || [], // Inicializar lista vacía
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const created = await lumi.entities.clientes.create(newCliente)
      
      // Intentar sincronizar con Outlook
      try {
        await syncToOutlook(created)
      } catch (outlookError) {
        console.warn('Error sincronizando con Outlook:', outlookError)
      }
      
      setClientes(prev => [...prev, created])
      return created
    } catch (err: any) {
      console.error('Error adding cliente:', err)
      throw err
    }
  }

  const updateCliente = async (id: string, updates: Partial<Cliente>) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('ID debe ser una cadena válida')
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Datos de actualización inválidos')
      }
      
      if (updates.fechaBoda && !isValidDate(updates.fechaBoda)) {
        throw new Error('La fecha de boda no es válida')
      }

      // Validar emails si se están actualizando
      if (updates.emails) {
        if (!Array.isArray(updates.emails)) {
          updates.emails = [updates.emails].filter(Boolean)
        } else {
          updates.emails = updates.emails.filter(email => email && typeof email === 'string' && email.trim())
        }
      }

      // Validar lista de invitados si se está actualizando
      if (updates.listaInvitados && !Array.isArray(updates.listaInvitados)) {
        updates.listaInvitados = []
      }
      
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      const updated = await lumi.entities.clientes.update(id, updatedData)
      
      // Actualizar en Outlook si está sincronizado
      const clienteActual = clientes.find(c => c._id === id)
      if (clienteActual?.sincronizadoOutlook) {
        try {
          await updateOutlookEvent(clienteActual, updated)
        } catch (outlookError) {
          console.warn('Error actualizando en Outlook:', outlookError)
        }
      }
      
      setClientes(prev => prev.map(cliente => 
        cliente._id === id ? { ...cliente, ...updated } : cliente
      ))
      return updated
    } catch (err: any) {
      console.error('Error updating cliente:', err)
      throw err
    }
  }

  const deleteCliente = async (id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('ID debe ser una cadena válida')
      }
      
      const cliente = clientes.find(c => c._id === id)
      
      // Eliminar de Outlook si está sincronizado
      if (cliente?.sincronizadoOutlook && cliente.outlookEventId) {
        try {
          await deleteOutlookEvent(cliente.outlookEventId)
        } catch (outlookError) {
          console.warn('Error eliminando de Outlook:', outlookError)
        }
      }
      
      await lumi.entities.clientes.delete(id)
      setClientes(prev => prev.filter(cliente => cliente._id !== id))
    } catch (err: any) {
      console.error('Error deleting cliente:', err)
      throw err
    }
  }

  // Nuevas funciones para gestión de lista de invitados
  const agregarInvitado = async (clienteId: string, nombreInvitado: string) => {
    try {
      if (!clienteId || !nombreInvitado?.trim()) {
        throw new Error('ID del cliente y nombre del invitado son requeridos')
      }

      const cliente = clientes.find(c => c._id === clienteId)
      if (!cliente) {
        throw new Error('Cliente no encontrado')
      }

      const nuevoInvitado: Invitado = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nombre: nombreInvitado.trim(),
        tachado: false,
        fechaAgregado: new Date().toISOString()
      }

      const listaActualizada = [...(cliente.listaInvitados || []), nuevoInvitado]
      
      await updateCliente(clienteId, { listaInvitados: listaActualizada })
      return nuevoInvitado
    } catch (err: any) {
      console.error('Error agregando invitado:', err)
      throw err
    }
  }

  const tacharInvitado = async (clienteId: string, invitadoId: string) => {
    try {
      if (!clienteId || !invitadoId) {
        throw new Error('ID del cliente e ID del invitado son requeridos')
      }

      const cliente = clientes.find(c => c._id === clienteId)
      if (!cliente) {
        throw new Error('Cliente no encontrado')
      }

      const listaActualizada = (cliente.listaInvitados || []).map(invitado => {
        if (invitado.id === invitadoId) {
          return {
            ...invitado,
            tachado: !invitado.tachado,
            fechaTachado: !invitado.tachado ? new Date().toISOString() : undefined
          }
        }
        return invitado
      })

      await updateCliente(clienteId, { listaInvitados: listaActualizada })
    } catch (err: any) {
      console.error('Error tachando invitado:', err)
      throw err
    }
  }

  const editarInvitado = async (clienteId: string, invitadoId: string, nuevoNombre: string) => {
    try {
      if (!clienteId || !invitadoId || !nuevoNombre?.trim()) {
        throw new Error('Todos los parámetros son requeridos')
      }

      const cliente = clientes.find(c => c._id === clienteId)
      if (!cliente) {
        throw new Error('Cliente no encontrado')
      }

      const listaActualizada = (cliente.listaInvitados || []).map(invitado => {
        if (invitado.id === invitadoId) {
          return {
            ...invitado,
            nombre: nuevoNombre.trim()
          }
        }
        return invitado
      })

      await updateCliente(clienteId, { listaInvitados: listaActualizada })
    } catch (err: any) {
      console.error('Error editando invitado:', err)
      throw err
    }
  }

  const eliminarInvitado = async (clienteId: string, invitadoId: string) => {
    try {
      if (!clienteId || !invitadoId) {
        throw new Error('ID del cliente e ID del invitado son requeridos')
      }

      const cliente = clientes.find(c => c._id === clienteId)
      if (!cliente) {
        throw new Error('Cliente no encontrado')
      }

      const listaActualizada = (cliente.listaInvitados || []).filter(invitado => invitado.id !== invitadoId)
      
      await updateCliente(clienteId, { listaInvitados: listaActualizada })
    } catch (err: any) {
      console.error('Error eliminando invitado:', err)
      throw err
    }
  }

  const getEstadisticasInvitados = (clienteId: string) => {
    try {
      const cliente = clientes.find(c => c._id === clienteId)
      if (!cliente || !cliente.listaInvitados) {
        return { total: 0, tachados: 0, pendientes: 0 }
      }

      const total = cliente.listaInvitados.length
      const tachados = cliente.listaInvitados.filter(inv => inv.tachado).length
      const pendientes = total - tachados

      return { total, tachados, pendientes }
    } catch (err: any) {
      console.error('Error obteniendo estadísticas de invitados:', err)
      return { total: 0, tachados: 0, pendientes: 0 }
    }
  }

  // Funciones de sincronización con Outlook
  const syncToOutlook = async (cliente: Cliente) => {
    try {
      if (!cliente || !cliente.nombres || !cliente.fechaBoda) {
        throw new Error('Datos del cliente incompletos para sincronización')
      }

      // Verificar si Microsoft Graph API está disponible
      if (typeof window !== 'undefined' && (window as any).msal) {
        const event = {
          subject: `Boda: ${cliente.nombres}`,
          start: {
            dateTime: cliente.fechaBoda,
            timeZone: 'UTC'
          },
          end: {
            dateTime: new Date(new Date(cliente.fechaBoda).getTime() + 8 * 60 * 60 * 1000).toISOString(),
            timeZone: 'UTC'
          },
          location: {
            displayName: `${cliente.venue || 'Venue no especificado'}, ${cliente.ciudad || 'Ciudad no especificada'}`
          },
          body: {
            contentType: 'HTML',
            content: `
              <h3>Detalles de la Boda</h3>
              <p><strong>Cliente:</strong> ${cliente.nombres}</p>
              <p><strong>Emails:</strong> ${(cliente.emails || []).join(', ')}</p>
              <p><strong>Teléfono:</strong> ${cliente.telefono || 'No especificado'}</p>
              <p><strong>Venue:</strong> ${cliente.venue || 'No especificado'}</p>
              <p><strong>Ciudad:</strong> ${cliente.ciudad || 'No especificada'}</p>
              <p><strong>Servicio:</strong> ${cliente.servicio?.nombre || 'No especificado'}</p>
              <p><strong>Monto:</strong> ${cliente.montoTotal || 0} ${cliente.divisa}</p>
              <p><strong>Estado:</strong> ${cliente.estado}</p>
              ${cliente.solicitudesEspeciales ? `<p><strong>Solicitudes Especiales:</strong> ${cliente.solicitudesEspeciales}</p>` : ''}
              ${cliente.notas ? `<p><strong>Notas:</strong> ${cliente.notas}</p>` : ''}
              ${cliente.listaInvitados && cliente.listaInvitados.length > 0 ? `
                <h4>Lista de Invitados (${cliente.listaInvitados.length})</h4>
                <ul>
                  ${cliente.listaInvitados.map(inv => `
                    <li${inv.tachado ? ' style="text-decoration: line-through; color: #999;"' : ''}>${inv.nombre}</li>
                  `).join('')}
                </ul>
              ` : ''}
            `
          },
          categories: ['Boda', 'Trabajo'],
          importance: 'high'
        }

        // Aquí iría la llamada real a Microsoft Graph API
        console.log('Sincronizando evento con Outlook:', event)
        
        // Simular respuesta exitosa por ahora
        return {
          id: `outlook_${Date.now()}`,
          success: true
        }
      }
    } catch (error) {
      console.error('Error en sincronización con Outlook:', error)
      throw error
    }
  }

  const updateOutlookEvent = async (clienteOriginal: Cliente, updates: Partial<Cliente>) => {
    try {
      if (!clienteOriginal?.outlookEventId) return
      
      console.log('Actualizando evento en Outlook:', clienteOriginal.outlookEventId, updates)
      // Aquí iría la llamada real a Microsoft Graph API para actualizar
    } catch (error) {
      console.error('Error actualizando evento en Outlook:', error)
      throw error
    }
  }

  const deleteOutlookEvent = async (outlookEventId: string) => {
    try {
      if (!outlookEventId || typeof outlookEventId !== 'string') return
      
      console.log('Eliminando evento de Outlook:', outlookEventId)
      // Aquí iría la llamada real a Microsoft Graph API para eliminar
    } catch (error) {
      console.error('Error eliminando evento de Outlook:', error)
      throw error
    }
  }

  const getClienteById = (id: string) => {
    if (!id || typeof id !== 'string') return undefined
    return clientes.find(cliente => cliente._id === id)
  }

  const detectarCoincidenciasFechas = () => {
    const coincidencias: Array<{
      fecha: string
      clientes: Cliente[]
    }> = []

    try {
      const clientesValidos = clientes.filter(cliente => 
        cliente && 
        cliente.fechaBoda && 
        typeof cliente.fechaBoda === 'string' && 
        isValidDate(cliente.fechaBoda)
      )

      const fechasAgrupadas = clientesValidos.reduce((acc, cliente) => {
        try {
          if (!cliente.fechaBoda) return acc
          
          const fecha = cliente.fechaBoda.split('T')[0]
          if (!fecha) return acc
          
          if (!acc[fecha]) {
            acc[fecha] = []
          }
          acc[fecha].push(cliente)
        } catch (error) {
          console.warn('Error procesando fecha del cliente:', cliente.nombres, cliente.fechaBoda)
        }
        return acc
      }, {} as Record<string, Cliente[]>)

      Object.entries(fechasAgrupadas).forEach(([fecha, clientesEnFecha]) => {
        if (clientesEnFecha && clientesEnFecha.length > 1) {
          coincidencias.push({
            fecha,
            clientes: clientesEnFecha
          })
        }
      })
    } catch (error) {
      console.error('Error detectando coincidencias de fechas:', error)
    }

    return coincidencias
  }

  const getClientesProximosEventos = (dias: number = 7) => {
    try {
      const hoy = new Date()
      const fechaLimite = new Date()
      fechaLimite.setDate(hoy.getDate() + dias)

      return clientes.filter(cliente => {
        if (!cliente || !cliente.fechaBoda || !isValidDate(cliente.fechaBoda)) return false
        
        try {
          const fechaBoda = new Date(cliente.fechaBoda)
          return fechaBoda >= hoy && fechaBoda <= fechaLimite
        } catch (error) {
          console.warn('Error procesando fecha próxima:', cliente.nombres, cliente.fechaBoda)
          return false
        }
      })
    } catch (error) {
      console.error('Error obteniendo próximos eventos:', error)
      return []
    }
  }

  const calcularIngresosMensuales = (mes: string) => {
    try {
      if (!mes || typeof mes !== 'string') return 0
      
      const [year, month] = mes.split('-')
      if (!year || !month) return 0
      
      const inicioMes = new Date(parseInt(year), parseInt(month) - 1, 1)
      const finMes = new Date(parseInt(year), parseInt(month), 0)

      let ingresosTotales = 0

      clientes.forEach(cliente => {
        if (!cliente || !cliente.detallesPago?.cuotas) return
        
        cliente.detallesPago.cuotas.forEach(cuota => {
          if (!cuota || cuota.estado !== 'pagado' || !cuota.fechaPago) return
          
          if (isValidDate(cuota.fechaPago)) {
            const fechaPago = new Date(cuota.fechaPago)
            if (fechaPago >= inicioMes && fechaPago <= finMes) {
              ingresosTotales += cuota.monto || 0
            }
          }
        })
      })

      return ingresosTotales
    } catch (error) {
      console.error('Error calculando ingresos mensuales:', error)
      return 0
    }
  }

  const getPagosVencidos = () => {
    try {
      const hoy = new Date()
      const pagosVencidos: Array<{
        cliente: Cliente
        cuota: any
      }> = []

      clientes.forEach(cliente => {
        if (!cliente || !cliente.detallesPago?.cuotas) return
        
        cliente.detallesPago.cuotas.forEach(cuota => {
          if (!cuota || cuota.estado !== 'pendiente' || !cuota.fechaPago) return
          
          if (isValidDate(cuota.fechaPago)) {
            const fechaPago = new Date(cuota.fechaPago)
            if (fechaPago < hoy) {
              pagosVencidos.push({ cliente, cuota })
            }
          }
        })
      })

      return pagosVencidos
    } catch (error) {
      console.error('Error obteniendo pagos vencidos:', error)
      return []
    }
  }

  const getProximosPagos = (dias: number = 7) => {
    try {
      const hoy = new Date()
      const fechaLimite = new Date()
      fechaLimite.setDate(hoy.getDate() + dias)

      const proximosPagos: Array<{
        cliente: Cliente
        cuota: any
      }> = []

      clientes.forEach(cliente => {
        if (!cliente || !cliente.detallesPago?.cuotas) return
        
        cliente.detallesPago.cuotas.forEach(cuota => {
          if (!cuota || cuota.estado !== 'pendiente' || !cuota.fechaPago) return
          
          if (isValidDate(cuota.fechaPago)) {
            const fechaPago = new Date(cuota.fechaPago)
            if (fechaPago >= hoy && fechaPago <= fechaLimite) {
              proximosPagos.push({ cliente, cuota })
            }
          }
        })
      })

      return proximosPagos
    } catch (error) {
      console.error('Error obteniendo próximos pagos:', error)
      return []
    }
  }

  useEffect(() => {
    loadClientes()
  }, [])

  return {
    clientes,
    loading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
    refreshClientes: loadClientes,
    detectarCoincidenciasFechas,
    getClientesProximosEventos,
    calcularIngresosMensuales,
    getPagosVencidos,
    getProximosPagos,
    syncToOutlook,
    // Nuevas funciones para gestión de invitados
    agregarInvitado,
    tacharInvitado,
    editarInvitado,
    eliminarInvitado,
    getEstadisticasInvitados
  }
}
