import { useCallback, useMemo } from "react"
import numbro from "numbro"
import { CurrencyPosition, CurrencySymbol, SupportedCurrency } from "../constants/currency"
import { useAppSelector } from "../state/hooks"

function useCurrency({ base, value, average, digits }: {
  base?: SupportedCurrency,
  value?: string | number,
  average?: boolean,
  digits?: number
}): {
  symbol: string,
  symbolPosition: 'prefix' | 'postfix',
  currency: string,
  currencyUnit: string,
  isSmall: boolean
} {
  const incomeCurrency = useMemo(() => base || SupportedCurrency.FIND, [base])
  const currentCurrency = useAppSelector((state) => state.user.currentCurrency || SupportedCurrency.USD)

  const formatValue = useMemo(() => {
    if (typeof value === 'string') return parseFloat(value)
    return value || 0
  }, [value])

  const currencySymbol = useMemo(() => CurrencySymbol[currentCurrency], [currentCurrency])
  const currencyPosition = useMemo(() => CurrencyPosition[currentCurrency], [currentCurrency])

  const formatCurrencyFn: (num: number) => [string, string, boolean] = useCallback((
    num: number,
  ) => {
    if (num === 0 || !num) return [`0.${''.padStart(digits || 2, '0')}`, '', false]
    const isSmall = num < parseFloat(`0.${''.padStart((digits || 2) - 1, '0')}1`)
    const format = numbro(num).format({
      average: average || true,
      mantissa: num > 1000 ? 2 : (digits || 2),
      abbreviations: { thousand: "K", million: "M", billion: "B", trillion: "T" },
      spaceSeparated: true,
    }).split(" ")
    return [format[0], format[1] || '', isSmall]
  }, [average, digits])

  const findPrice = useAppSelector((state) => state.price.findPrice)
  const ethPrice = useAppSelector((state) => state.price.ethPrice)
  const findDerivedETH = useAppSelector((state) => state.price.findDerivedETH)

  const [currency, currencyUnit, currencyIsSmall] = useMemo(() => {
    // eq
    // usd => find, usd => eth
    // find => usd, find => eth
    // eth => usd, eth => find
    if (incomeCurrency === currentCurrency) return formatCurrencyFn(formatValue)
    if (incomeCurrency === SupportedCurrency.USD) {
      if (currentCurrency === SupportedCurrency.FIND) {
        return formatCurrencyFn(formatValue / (findPrice || 1))
      }
      if (currentCurrency === SupportedCurrency.ETH) {
        return formatCurrencyFn(formatValue / (ethPrice || 1))
      }
    }
    if (incomeCurrency === SupportedCurrency.FIND) {
      if (currentCurrency === SupportedCurrency.USD) {
        return formatCurrencyFn(formatValue * findPrice)
      }
      if (currentCurrency === SupportedCurrency.ETH) {
        return formatCurrencyFn(formatValue * findDerivedETH)
      }
    }
    if (incomeCurrency === SupportedCurrency.ETH) {
      if (currentCurrency === SupportedCurrency.USD) {
        return formatCurrencyFn(formatValue * ethPrice)
      }
      if (currentCurrency === SupportedCurrency.FIND) {
        return formatCurrencyFn(formatValue / (findDerivedETH || 1))
      }
    }
    return [formatValue.toString(), '', false]
  }, [currentCurrency, ethPrice, findDerivedETH, findPrice, formatCurrencyFn, formatValue, incomeCurrency])

  return useMemo(() => ({
    symbol: currencySymbol,
    symbolPosition: currencyPosition,
    currency,
    currencyUnit,
    isSmall: currencyIsSmall
  }), [currency, currencyUnit, currencyIsSmall, currencyPosition, currencySymbol])
}

export default useCurrency