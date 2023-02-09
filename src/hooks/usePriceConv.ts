import { CurrencyAmount, Fraction, Token } from "@uniswap/sdk-core";
import { useCallback, useMemo } from "react";
import { currentChainId } from "../constants/chains";
import { FIND } from "../constants/token";
import useActiveWeb3React from "./useActiveWeb3React";
import JSBI from "jsbi"

export default function usePriceConv(price?: Fraction) {
  const { chainId } = useActiveWeb3React()
  const parsePrice = useMemo(() => (!price || price.equalTo(0)) ? new Fraction(1000) : price, [price])

  const convAToFind = useCallback((selectToken: Token, a: Fraction) => {
    if (selectToken.address === FIND[currentChainId(chainId)].address) {
      return CurrencyAmount.fromRawAmount(FIND[currentChainId(chainId)], a.quotient)
    }
    const scalar = new Fraction(
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(FIND[currentChainId(chainId)].decimals)),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(selectToken.decimals))
    )
    return CurrencyAmount.fromRawAmount(FIND[currentChainId(chainId)], parsePrice.multiply(a).multiply(scalar).quotient)
  }, [chainId, parsePrice])

  const convFindToA = useCallback((selectToken: Token, a: Fraction) => {
    if (selectToken.address === FIND[currentChainId(chainId)].address) {
      return CurrencyAmount.fromRawAmount(selectToken, a.quotient)
    }
    const scalar = new Fraction(
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(selectToken.decimals)),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(FIND[currentChainId(chainId)].decimals)),
    )
    return CurrencyAmount.fromRawAmount(selectToken, a.divide(parsePrice).multiply(scalar).quotient) 
  }, [chainId, parsePrice])

  return useMemo(() => {
    return {
      convAToFind, convFindToA
    }
  }, [convAToFind, convFindToA])
}