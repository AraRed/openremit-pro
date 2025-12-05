/**
 * 🎯 WHY: Currency Configuration
 *
 * Defines available source and destination currencies
 * with metadata for UI display
 *
 * 💡 KEY DECISION: Source is CRYPTO ONLY
 * Why? This is a Telegram Mini App. Users already have crypto wallets.
 * They're not depositing fiat - they're sending crypto they already own.
 */

import type { SourceCurrency, DestinationCurrency, CurrencyInfo } from './types'

/**
 * Source currencies - what users can send FROM
 * CRYPTO ONLY - Telegram users have crypto wallets
 */
export const SOURCE_CURRENCIES: Record<SourceCurrency, CurrencyInfo> = {
  USDC: {
    code: 'USDC',
    name: 'USD Coin',
    type: 'crypto',
    icon: '💲'
  },
  USDT: {
    code: 'USDT',
    name: 'Tether',
    type: 'crypto',
    icon: '₮'
  },
  ETH: {
    code: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    icon: '⟠'
  },
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    icon: '₿'
  }
}

/**
 * Destination currencies - what recipients can receive
 */
export const DESTINATION_CURRENCIES: Record<DestinationCurrency, CurrencyInfo> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    type: 'fiat',
    icon: '💵'
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    type: 'fiat',
    icon: '🇧🇷'
  },
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    type: 'fiat',
    icon: '🇳🇬'
  },
  ETH: {
    code: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    icon: '⟠'
  },
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    icon: '₿'
  },
  USDC: {
    code: 'USDC',
    name: 'USD Coin',
    type: 'crypto',
    icon: '💲'
  },
  USDT: {
    code: 'USDT',
    name: 'Tether',
    type: 'crypto',
    icon: '₮'
  }
}

/**
 * Countries with their available destination currencies
 */
export const COUNTRIES = {
  'Brazil': {
    name: 'Brazil',
    icon: '🇧🇷',
    fiatCurrency: 'BRL' as DestinationCurrency,
    cryptoOptions: ['ETH', 'BTC', 'USDC', 'USDT'] as DestinationCurrency[]
  },
  'Nigeria': {
    name: 'Nigeria',
    icon: '🇳🇬',
    fiatCurrency: 'NGN' as DestinationCurrency,
    cryptoOptions: ['ETH', 'BTC', 'USDC', 'USDT'] as DestinationCurrency[]
  },
  'United States': {
    name: 'United States',
    icon: '🇺🇸',
    fiatCurrency: 'USD' as DestinationCurrency,
    cryptoOptions: ['ETH', 'BTC', 'USDC', 'USDT'] as DestinationCurrency[]
  }
} as const

export type CountryName = keyof typeof COUNTRIES

/**
 * Get available destination currencies for a country
 */
export function getDestinationOptionsForCountry(country: CountryName): DestinationCurrency[] {
  const countryInfo = COUNTRIES[country]
  return [countryInfo.fiatCurrency, ...countryInfo.cryptoOptions]
}

/**
 * Get country from fiat currency
 */
export function getCountryFromCurrency(currency: DestinationCurrency): CountryName | undefined {
  for (const [countryName, info] of Object.entries(COUNTRIES)) {
    if (info.fiatCurrency === currency) {
      return countryName as CountryName
    }
  }
  return undefined
}
