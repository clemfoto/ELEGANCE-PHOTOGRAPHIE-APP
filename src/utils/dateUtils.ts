
export function isValidDate(dateString: any): boolean {
  try {
    // Validaciones defensivas
    if (!dateString) return false
    if (typeof dateString !== 'string') return false
    if (dateString.trim() === '') return false
    
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && date.getFullYear() > 1900
  } catch (error) {
    console.warn('Error validating date:', dateString, error)
    return false
  }
}

export function safeFormatDate(dateString: any, fallback: string = 'Fecha no válida'): string {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return fallback
    }
    
    if (!isValidDate(dateString)) {
      return fallback
    }
    
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Error formatting date:', dateString, error)
    return fallback
  }
}

export function formatDateForInput(dateString: any): string {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return ''
    }
    
    if (!isValidDate(dateString)) {
      return ''
    }
    
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16)
  } catch (error) {
    console.warn('Error formatting date for input:', dateString, error)
    return ''
  }
}

export function addDays(dateString: any, days: number): string {
  try {
    if (!dateString || typeof dateString !== 'string' || !isValidDate(dateString)) {
      return new Date().toISOString()
    }
    
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString()
  } catch (error) {
    console.warn('Error adding days to date:', dateString, days, error)
    return new Date().toISOString()
  }
}

export function getDaysBetween(startDate: any, endDate: any): number {
  try {
    if (!startDate || !endDate || 
        typeof startDate !== 'string' || typeof endDate !== 'string' ||
        !isValidDate(startDate) || !isValidDate(endDate)) {
      return 0
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.warn('Error calculating days between dates:', startDate, endDate, error)
    return 0
  }
}
