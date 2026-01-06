// Storage keys
export const STORAGE_KEY = 'psx_portfolio'
export const PRICE_CACHE_KEY = 'psx_price_cache'

// Cache duration in milliseconds (15 minutes)
export const CACHE_DURATION = 15 * 60 * 1000

// Stock categories for PSX
export const STOCK_CATEGORIES = [
  { value: 'oil_gas', label: 'Oil & Gas' },
  { value: 'oil_gas_exploration', label: 'Oil & Gas Exploration' },
  { value: 'banking', label: 'Banking' },
  { value: 'cement', label: 'Cement' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'power', label: 'Power & Energy' },
  { value: 'energy', label: 'Energy' },
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
  { value: 'food', label: 'Food & Personal Care' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'construction', label: 'Construction' },
  { value: 'conglomerate', label: 'Conglomerate' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'etf', label: 'ETF' },
  { value: 'other', label: 'Other' }
]

// Symbol to Category mapping for auto-population
export const SYMBOL_CATEGORY_MAP = {
  DCR: 'reit',
  ILP: 'textile',
  MARI: 'energy',
  MEBL: 'banking',
  CPHL: 'pharma',
  HINOON: 'pharma',
  GLAXO: 'pharma',
  EFERT: 'fertilizer',
  ENGRO: 'fertilizer',
  ENGROH: 'conglomerate',
  FFBL: 'fertilizer',
  HUBC: 'power',
  FCCL: 'construction',
  EPCL: 'construction',
  TGL: 'construction',
  MTL: 'automobile',
  SAZEW: 'automobile',
  ATLH: 'automobile',
  SYS: 'technology',
  LOTCHEM: 'chemical',
  MIIETF: 'etf',
  MZNPETF: 'etf',
  LUCK: 'conglomerate',
  OGDC: 'oil_gas_exploration',
  PAEL: 'consumer',
  PPL: 'energy',
  NATF: 'food',
  MUGHAL: 'construction',
  MLCF: 'construction',
  LCI: 'conglomerate',
  // Add more mappings as needed
  HBL: 'banking',
  UBL: 'banking',
  MCB: 'banking',
  NBP: 'banking',
  BAHL: 'banking',
  PSO: 'oil_gas',
  FFC: 'fertilizer',
  DGKC: 'cement',
  PIOC: 'cement',
  KOHC: 'cement',
  KEL: 'power',
  KAPCO: 'power',
  NPL: 'power',
  ISL: 'steel',
  ASTL: 'steel',
  POL: 'oil_gas_exploration',
  TRG: 'technology',
  AVN: 'technology',
  SEARL: 'pharma',
  AGP: 'pharma',
  NESTLE: 'fmcg',
  UNITY: 'fmcg',
  COLG: 'fmcg',
  ATRL: 'refinery',
  NRL: 'refinery',
  PRL: 'refinery',
  BYCO: 'refinery'
}

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

