/**
 * @module useCreditCardFormatters
 * @description Un composable de Vue que proporciona un conjunto de utilidades para validar, formatear y procesar información de tarjetas de crédito.
 */
export function useCreditCardFormatters() {
  /**
   * Valida un número de tarjeta de crédito.
   * @param {string} number - El número de tarjeta de crédito a validar.
   * @returns {string|null} El número de tarjeta limpio de 16 dígitos si es válido, de lo contrario, `null`.
   */
  const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\D/g, '')
    return cleanNumber.length === 16 ? cleanNumber : null
  }

  /**
   * Valida la fecha de expiración de una tarjeta de crédito.
   * @param {string} date - La fecha de expiración en formato 'MM/YY' o 'MM/YYYY'.
   * @returns {boolean} `true` si la fecha es válida y no ha expirado, de lo contrario, `false`.
   */
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

  /**
   * Formatea un número de tarjeta de crédito para la entrada del usuario, agregando espacios.
   * @param {string} value - El valor de entrada del número de la tarjeta.
   * @returns {string} El número de tarjeta formateado (ej. 'XXXX XXXX XXXX XXXX').
   */
  const formatCardNumberInput = (value) => {
    const cleanValue = value.replace(/\D/g, '')
    const parts = []
    for (let i = 0; i < cleanValue.length; i += 4) {
      parts.push(cleanValue.substring(i, i + 4))
    }
    return parts.join(' ').substring(0, 19) // Limita a 16 dígitos + 3 espacios
  }

  /**
   * Formatea una fecha de expiración para la entrada del usuario, agregando una barra (/).
   * @param {string} value - El valor de entrada de la fecha de expiración.
   * @returns {string} La fecha de expiración formateada ('MM/YY').
   */
  const formatExpirationDateInput = (value) => {
    let cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length > 4) cleanValue = cleanValue.substring(0, 4)
    if (cleanValue.length > 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2)
    }
    return cleanValue
  }

  /**
   * Obtiene los últimos cuatro dígitos de un número de tarjeta.
   * @param {string} number - El número de la tarjeta.
   * @returns {string} Los últimos cuatro dígitos o 'XXXX' si no se proporciona un número.
   */
  const getLastFour = (number) => (number ? number.substring(number.length - 4) : 'XXXX')

  /**
   * Determina el tipo de tarjeta (Visa, MasterCard, etc.) a partir de su número.
   * @param {string} number - El número de la tarjeta.
   * @returns {string} El tipo de tarjeta ('Visa', 'MasterCard', 'Amex', 'Tarjeta').
   */
  const getCardType = (number) => {
    if (!number) return 'Card'
    const cleanNumber = String(number).replace(/\D/g, '')
    if (cleanNumber.startsWith('4')) return 'Visa'
    if (cleanNumber.match(/^5[1-5]/)) return 'MasterCard'
    if (cleanNumber.match(/^3[47]/)) return 'Amex'
    return 'Tarjeta'
  }

  /**
   * Formatea una fecha en formato ISO a una cadena 'MM/YY'.
   * @param {string} isoDate - La fecha en formato de cadena ISO.
   * @returns {string} La fecha formateada como 'MM/YY'.
   */
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