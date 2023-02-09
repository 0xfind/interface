import { FC, ReactNode, useMemo } from "react";
import { SupportedCurrency } from "../../constants/currency";
import useCurrency from "../../hooks/useCurrency";

type CurrencyTextProps = {
  base?: SupportedCurrency,
  value?: string | number,
  spaceSeparated?: boolean,
  average?: boolean,
  digits?: number,
  children: ReactNode
}

const CurrencyText: FC<CurrencyTextProps> = ({ base, value, spaceSeparated, average, digits, children }) => {
  const income = useMemo(() => value || (children as any), [children, value])
  const {
    currency, currencyUnit, symbol, symbolPosition, isSmall
  } = useCurrency({ base, value: income, average, digits })

  return useMemo(() => {
    if (isSmall) {
      const smallText = `0.${''.padStart((digits || 2) - 1, '0')}1`
      return <>{symbolPosition === 'prefix' ? `<${symbol} ${smallText}` : `<${smallText} ${symbol}`}</>
    }
    if (symbolPosition === 'prefix') return <>{symbol}{(spaceSeparated === undefined || spaceSeparated) ? ' ' : ''}{currency}{currencyUnit}</>
    else return <>{currency}{currencyUnit}{(spaceSeparated === undefined || spaceSeparated) ? ' ' : ''}{symbol}</>
  }, [currency, currencyUnit, digits, isSmall, spaceSeparated, symbol, symbolPosition])
}

export default CurrencyText;