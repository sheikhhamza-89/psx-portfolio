/**
 * XIRR (Extended Internal Rate of Return) Calculator
 * Calculates the annualized return for irregular cash flows
 */

/**
 * Calculate the number of years between two dates
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {number} Years (can be fractional)
 */
function yearFrac(startDate, endDate) {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000
  return (endDate - startDate) / msPerYear
}

/**
 * Calculate XNPV (Net Present Value for irregular cash flows)
 * @param {number} rate - The discount rate
 * @param {Array<{amount: number, date: Date}>} cashFlows - Array of cash flows
 * @returns {number} Net present value
 */
function xnpv(rate, cashFlows) {
  const firstDate = cashFlows[0].date
  
  return cashFlows.reduce((npv, cf) => {
    const years = yearFrac(firstDate, cf.date)
    return npv + cf.amount / Math.pow(1 + rate, years)
  }, 0)
}

/**
 * Calculate XIRR using Newton-Raphson method
 * @param {Array<{amount: number, date: Date}>} cashFlows - Array of cash flows
 * @param {number} guess - Initial guess for rate (default 0.1 = 10%)
 * @param {number} maxIterations - Maximum iterations
 * @param {number} tolerance - Convergence tolerance
 * @returns {number|null} XIRR as decimal (0.15 = 15%) or null if no solution
 */
export function calculateXIRR(cashFlows, guess = 0.1, maxIterations = 100, tolerance = 0.0001) {
  if (!cashFlows || cashFlows.length < 2) {
    return null
  }

  // Validate cash flows - need at least one positive and one negative
  const hasNegative = cashFlows.some(cf => cf.amount < 0)
  const hasPositive = cashFlows.some(cf => cf.amount > 0)
  
  if (!hasNegative || !hasPositive) {
    return null
  }

  // Sort by date
  const sortedCashFlows = [...cashFlows].sort((a, b) => a.date - b.date)
  
  let rate = guess
  
  for (let i = 0; i < maxIterations; i++) {
    const npv = xnpv(rate, sortedCashFlows)
    
    // Calculate derivative for Newton-Raphson
    const firstDate = sortedCashFlows[0].date
    let derivative = 0
    
    for (const cf of sortedCashFlows) {
      const years = yearFrac(firstDate, cf.date)
      if (years !== 0) {
        derivative -= years * cf.amount / Math.pow(1 + rate, years + 1)
      }
    }
    
    if (Math.abs(derivative) < 1e-10) {
      // Derivative too small, try a different approach
      break
    }
    
    const newRate = rate - npv / derivative
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate
    }
    
    rate = newRate
    
    // Prevent rate from going too extreme
    if (rate < -0.99) rate = -0.99
    if (rate > 10) rate = 10
  }
  
  // If Newton-Raphson didn't converge, try bisection method
  return bisectionXIRR(sortedCashFlows)
}

/**
 * Fallback bisection method for XIRR
 */
function bisectionXIRR(cashFlows, maxIterations = 100, tolerance = 0.0001) {
  let low = -0.99
  let high = 10
  
  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2
    const npv = xnpv(mid, cashFlows)
    
    if (Math.abs(npv) < tolerance) {
      return mid
    }
    
    if (xnpv(low, cashFlows) * npv < 0) {
      high = mid
    } else {
      low = mid
    }
    
    if (Math.abs(high - low) < tolerance) {
      return mid
    }
  }
  
  return null
}

/**
 * Calculate portfolio XIRR from stocks
 * @param {Array} stocks - Portfolio stocks with addedAt, shares, purchasePrice, currentPrice
 * @returns {number|null} XIRR percentage or null if cannot calculate
 */
export function calculatePortfolioXIRR(stocks) {
  if (!stocks || stocks.length === 0) {
    return null
  }

  const now = new Date()
  const cashFlows = []

  // Add purchase cash flows (negative - money going out)
  for (const stock of stocks) {
    const purchaseDate = stock.addedAt ? new Date(stock.addedAt) : new Date()
    const purchaseAmount = -(stock.shares * stock.purchasePrice)
    
    cashFlows.push({
      amount: purchaseAmount,
      date: purchaseDate
    })
  }

  // Add current value as final cash flow (positive - as if selling today)
  const totalCurrentValue = stocks.reduce((sum, stock) => 
    sum + (stock.shares * (stock.currentPrice || stock.purchasePrice)), 0
  )

  cashFlows.push({
    amount: totalCurrentValue,
    date: now
  })

  const xirr = calculateXIRR(cashFlows)
  
  return xirr !== null ? xirr * 100 : null // Return as percentage
}

