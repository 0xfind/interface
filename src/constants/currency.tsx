export enum SupportedCurrency {
  USD = "usd",
  ETH = 'eth',
  FIND = "find",
}

export const CurrencySymbol: Record<SupportedCurrency, string> = {
  [SupportedCurrency.USD]: "$",
  [SupportedCurrency.ETH]: "Ξ",
  [SupportedCurrency.FIND]: "F",
}

export const CurrencyPosition: Record<SupportedCurrency, 'prefix' | 'postfix'> = {
  [SupportedCurrency.USD]: "prefix",
  [SupportedCurrency.ETH]: "prefix",
  [SupportedCurrency.FIND]: "prefix",
}