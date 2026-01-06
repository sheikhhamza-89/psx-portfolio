// Storage keys
export const STORAGE_KEY = 'psx_portfolio'
export const PRICE_CACHE_KEY = 'psx_price_cache'

// Cache duration in milliseconds (15 minutes)
export const CACHE_DURATION = 15 * 60 * 1000

// Stock categories for PSX
export const STOCK_CATEGORIES = [
  { value: 'oil_gas', label: 'Oil & Gas' },
  { value: 'banking', label: 'Banking' },
  { value: 'cement', label: 'Cement' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'power', label: 'Power & Energy' },
  { value: 'steel', label: 'Steel' },
  { value: 'technology', label: 'Technology' },
  { value: 'pharma', label: 'Pharmaceutical' },
  { value: 'fmcg', label: 'FMCG' },
  { value: 'refinery', label: 'Refinery' },
  { value: 'reit', label: 'REIT' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'textile', label: 'Textile' },
  { value: 'automobile', label: 'Automobile' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'other', label: 'Other' }
]

// Common PSX stock symbols for validation hints
export const COMMON_SYMBOLS = [
  'OGDC', 'PPL', 'PSO', 'HBL', 'UBL', 'MCB', 'NBP', 'BAHL', 'MEBL',
  'LUCK', 'DGKC', 'MLCF', 'PIOC', 'FCCL', 'KOHC',
  'ENGRO', 'EFERT', 'FFC', 'FFBL',
  'HUBC', 'KEL', 'KAPCO', 'NPL',
  'MTL', 'ISL', 'ASTL',
  'MARI', 'POL',
  'SYS', 'TRG', 'AVN',
  'SEARL', 'GLAXO', 'AGP',
  'NESTLE', 'UNITY', 'COLG',
  'ATRL', 'NRL', 'PRL', 'BYCO'
]

// CORS proxies for fetching PSX data
export const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
]

// PSX base URL
export const PSX_BASE_URL = 'https://dps.psx.com.pk/company/'

