
import React, { useState, useEffect } from 'react'
import { useClientes } from '../hooks/useClientes'
import { useContabilidad } from '../hooks/useContabilidad'
import {DollarSign, TrendingUp, TrendingDown, Calendar, Eye, EyeOff, Plus, Trash2} from 'lucide-react'
import toast from 'react-hot-toast'

const Contabilidad: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: 'general',
    date: new Date().toISOString().slice(0, 10)
  })

  const { clientes } = useClientes()
  const { gastos, loading, crearGasto, eliminarGasto } = useContabilidad()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'admin123') {
      setAuthenticated(true)
      toast.success('Acceso autorizado')
    } else {
      toast.error('Contraseña incorrecta')
    }
  }

  const calculateMonthlyIncome = () => {
    if (!clientes) return 0
    
    const [year, month] = selectedMonth.split('-').map(Number)
    let totalIncome = 0

    clientes.forEach(cliente => {
      if (cliente.pagos && Array.isArray(cliente.pagos)) {
        cliente.pagos.forEach(pago => {
          const pagoDate = new Date(pago.fechaPago)
          if (pagoDate.getFullYear() === year && pagoDate.getMonth() + 1 === month) {
            totalIncome += pago.monto || 0
          }
        })
      }
    })

    return totalIncome
  }

  const calculateMonthlyExpenses = () => {
    if (!gastos) return 0
    
    const [year, month] = selectedMonth.split('-').map(Number)
    
    return gastos
      .filter(gasto => {
        const gastoDate = new Date(gasto.fecha)
        return gastoDate.getFullYear() === year && gastoDate.getMonth() + 1 === month
      })
      .reduce((total, gasto) => total + gasto.monto, 0)
  }

  const getPaymentMethodSummary = () => {
    if (!clientes) return {}
    
    const [year, month] = selectedMonth.split('-').map(Number)
    const summary: { [key: string]: number } = {}

    clientes.forEach(cliente => {
      if (cliente.pagos && Array.isArray(cliente.pagos)) {
        cliente.pagos.forEach(pago => {
          const pagoDate = new Date(pago.fechaPago)
          if (pagoDate.getFullYear() === year && pagoDate.getMonth() + 1 === month) {
            const method = pago.metodoPago || 'No especificado'
            summary[method] = (summary[method] || 0) + (pago.monto || 0)
          }
        })
      }
    })

    return summary
  }

  const getPendingPayments = () => {
    if (!clientes) return []
    
    const pending: any[] = []
    const today = new Date()

    clientes.forEach(cliente => {
      if (cliente.pagos && Array.isArray(cliente.pagos)) {
        cliente.pagos.forEach(pago => {
          if (pago.estado === 'pendiente') {
            const dueDate = new Date(pago.fechaVencimiento || pago.fechaPago)
            const isOverdue = dueDate < today
            pending.push({
              cliente: cliente.nombre,
              monto: pago.monto,
              fechaVencimiento: pago.fechaVencimiento || pago.fechaPago,
              isOverdue,
              metodoPago: pago.metodoPago
            })
          }
        })
      }
    })

    return pending.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await crearGasto({
        descripcion: newExpense.description,
        monto: newExpense.amount,
        categoria: newExpense.category,
        fecha: newExpense.date
      })
      
      setNewExpense({
        description: '',
        amount: 0,
        category: 'general',
        date: new Date().toISOString().slice(0, 10)
      })
      setShowAddExpense(false)
      toast.success('Gasto agregado exitosamente')
    } catch (error) {
      toast.error('Error al agregar gasto')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Acceso a Contabilidad
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ingresa la contraseña para acceder
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contraseña"
              />
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Acceder
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const monthlyIncome = calculateMonthlyIncome()
  const monthlyExpenses = calculateMonthlyExpenses()
  const netProfit = monthlyIncome - monthlyExpenses
  const paymentMethods = getPaymentMethodSummary()
  const pendingPayments = getPendingPayments()

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Contabilidad</h1>
          <div className="flex items-center space-x-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => setAuthenticated(false)}
              className="text-red-600 hover:text-red-800"
            >
              <EyeOff className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-900 truncate">
                      Ingresos del Mes
                    </dt>
                    <dd className="text-lg font-medium text-green-900">
                      ${monthlyIncome.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-red-900 truncate">
                      Gastos del Mes
                    </dt>
                    <dd className="text-lg font-medium text-red-900">
                      ${monthlyExpenses.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className={`${netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'} overflow-hidden shadow rounded-lg`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className={`h-8 w-8 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'} truncate`}>
                      {netProfit >= 0 ? 'Ganancia Neta' : 'Pérdida Neta'}
                    </dt>
                    <dd className={`text-lg font-medium ${netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                      ${Math.abs(netProfit).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métodos de pago */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Ingresos por Método de Pago
              </h3>
              <div className="space-y-3">
                {Object.entries(paymentMethods).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">{method}</span>
                    <span className="text-sm text-gray-500">${amount.toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(paymentMethods).length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No hay ingresos registrados este mes
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pagos pendientes */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Pagos Pendientes
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pendingPayments.map((payment, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      payment.isOverdue ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{payment.cliente}</p>
                        <p className="text-sm text-gray-600">{payment.metodoPago}</p>
                        <p className="text-xs text-gray-500">
                          Vence: {new Date(payment.fechaVencimiento).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${payment.isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                          ${payment.monto?.toLocaleString()}
                        </p>
                        {payment.isOverdue && (
                          <span className="text-xs text-red-500">Vencido</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {pendingPayments.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No hay pagos pendientes
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Gestión de gastos */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Gastos del Mes
                </h3>
                <button
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar Gasto
                </button>
              </div>

              {showAddExpense && (
                <form onSubmit={handleAddExpense} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Descripción</label>
                      <input
                        type="text"
                        required
                        value={newExpense.description}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monto</label>
                      <input
                        type="number"
                        required
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoría</label>
                      <select
                        value={newExpense.category}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="transporte">Transporte</option>
                        <option value="materiales">Materiales</option>
                        <option value="servicios">Servicios</option>
                        <option value="marketing">Marketing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha</label>
                      <input
                        type="date"
                        required
                        value={newExpense.date}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Agregar
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {gastos?.filter(gasto => {
                  const [year, month] = selectedMonth.split('-').map(Number)
                  const gastoDate = new Date(gasto.fecha)
                  return gastoDate.getFullYear() === year && gastoDate.getMonth() + 1 === month
                }).map(gasto => (
                  <div key={gasto._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{gasto.descripcion}</p>
                      <p className="text-sm text-gray-600">{gasto.categoria}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(gasto.fecha).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-red-600">
                        -${gasto.monto.toLocaleString()}
                      </span>
                      <button
                        onClick={() => eliminarGasto(gasto._id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contabilidad
