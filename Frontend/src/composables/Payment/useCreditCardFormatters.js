/**
 * Validadores y formateadores para tarjetas de crédito.
 */
export function useCreditCardFormatters() {
  const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '')
    return cleanNumber.length === 16 ? cleanNumber : null
  }

  const validateExpirationDate = (date) => {
    const regex = /^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/
    if (!regex.test(date)) return false
    const [monthStr, yearStr] = date.split('/').map((s) => s.trim())
    const month = parseInt(monthStr, 10)
    let year = parseInt(yearStr, 10)
    if (yearStr.length === 2) {
      const currentYearPrefix = new Date().getFullYear().toString().substring(0, 2)
      year = parseInt(currentYearPrefix + yearStr, 10)
    }
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    if (year < currentYear) return false
    if (year === currentYear && month < currentMonth) return false
    return true
  }

  const formatCardNumberInput = (value) => {
    const cleanValue = value.replace(/\D/g, '')
    const parts = []
    for (let i = 0; i < cleanValue.length; i += 4) {
      parts.push(cleanValue.substring(i, i + 4))
    }
    return parts.join(' ').substring(0, 19) // Limita a 16 dígitos + 3 espacios
  }

  const formatExpirationDateInput = (value) => {
    let cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length > 4) cleanValue = cleanValue.substring(0, 4)
    if (cleanValue.length > 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2)
    }
    return cleanValue
  }

  const getLastFour = (number) => (number ? number.substring(number.length - 4) : 'XXXX')

  const getCardType = (number) => {
    if (!number) return 'Card'
    const cleanNumber = String(number).replace(/\D/g, '')
    if (cleanNumber.startsWith('4')) return 'Visa'
    if (cleanNumber.match(/^5[1-5]/)) return 'MasterCard'
    if (cleanNumber.match(/^3[47]/)) return 'Amex'
    return 'Tarjeta'
  }

  const formatExpiryDisplay = (isoDate) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    const month = date.getUTCMonth() + 1
    const year = date.getUTCFullYear() % 100
    return `${month < 10 ? '0' + month : month}/${year < 10 ? '0' + year : year}`
  }

  return {
    validateCardNumber,
    validateExpirationDate,
    formatCardNumberInput,
    formatExpirationDateInput,
    getLastFour,
    getCardType,
    formatExpiryDisplay,
  }
}