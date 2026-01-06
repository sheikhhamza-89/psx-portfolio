/**
 * Format a number with Pakistani locale formatting
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0.00'
  
  return parseFloat(num).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Format currency with PKR prefix
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return `PKR ${formatNumber(amount)}`
}

/**
 * Format percentage with sign
 * @param {number} percent - The percentage value
 * @returns {string} Formatted percentage string
 */
export function formatPercent(percent) {
  const formatted = parseFloat(percent).toFixed(2)
  return percent >= 0 ? `+${formatted}%` : `${formatted}%`
}

