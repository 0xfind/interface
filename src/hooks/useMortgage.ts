import { useCallback, useEffect, useMemo, useState } from "react";
import JSBI from 'jsbi';
import { mortgagedInOsp, inverseMortgagedInOspByFindAmount, multiplyInFind, inverseRedeemInOspByFindAmount, inverseCashInOspByFindAmount } from "../utils/mortgage";
import useActiveWeb3React from "./useActiveWeb3React";
import { useFindMortgageContract } from "./useContract";
import { TokenData } from "./useTokens";
import { useSingleCallResult } from "./multicall";
import { FIND } from "../constants/token";
import { currentChainId } from "../constants/chains";
import { CurrencyAmount, Fraction, Token } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";

// export type MortgagePosition = {
//   positionId: number
//   findDebt: JSBI
//   collLocked: JSBI
//   token?: TokenData
// }

export type MortgagePosition = {
  positionId: number;
  ospAsset: string;
  ospAmount: JSBI;
}

type CurrencyAmountUpdate = (amount: CurrencyAmount<Token>) => void

export function useMortgage(chainId: any) {
  const findMortgage = useFindMortgageContract()
  const { account } = useActiveWeb3React()

  const pos = useSingleCallResult(findMortgage, "positionsOfOwner", [account])

  const [positions, setPositions] = useState<MortgagePosition[]>([])
  const [positionsLoading, setPositionsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!pos.loading) setTimeout(() => setPositionsLoading(false), 1000)
    if (!pos.result || !pos.result[0] || pos.result[0].length === 0) {
      setPositions([])
      return
    }
    const ps = []
    for (let i = 0; i < pos.result[0].length; i++) {
      const p = pos.result[0][i]
      if ((p.ospAmount as BigNumber).gt(0)) {
        ps.push({
          positionId: parseInt(p.tokenId),
          ospAsset: p.ospAsset.toLowerCase(),
          ospAmount: JSBI.BigInt((p.ospAmount as BigNumber).toString())
        })
      }
    }
    if (ps.length > 0) setPositions(ps)
  }, [pos])

  const getOspMortgaged = useCallback((positionId?: number) => {
    const p = positions.find(p => p.positionId === positionId)
    if (!positionId || !p) return JSBI.BigInt(0)
    return p.ospAmount
  }, [positions])

  const [mortgageInOspLoading, setMortgageInOspLoading] = useState<boolean>(false)
  const [mortgageOutFindLoading, setMortgageOutFindLoading] = useState<boolean>(false)

  const targetMortgageInOsp = useCallback((ospAmount: CurrencyAmount<Token>, positionId: number | undefined, setOutFind: CurrencyAmountUpdate, setFee: CurrencyAmountUpdate) => {
    const existed = getOspMortgaged(positionId)
    setMortgageInOspLoading(true)
    mortgagedInOsp(ospAmount.quotient, existed).then(([a, fee]) => {
      setOutFind(a);
      (() => { setFee(fee) })()
      // setFee(fee)
    }).finally(() => setMortgageInOspLoading(false))
  }, [getOspMortgaged])

  const targetRedeemInOsp = useCallback((ospAmount: CurrencyAmount<Token>, positionId: number | undefined, setOutFind: CurrencyAmountUpdate) => {
    const existed = getOspMortgaged(positionId)
    const amount = ospAmount.quotient
    const redeemExisted = JSBI.greaterThan(amount, existed) ? JSBI.BigInt(0) : JSBI.subtract(existed, amount)
    setMortgageInOspLoading(true)
    mortgagedInOsp(amount, redeemExisted).then(([a, fee]) => {
      setOutFind(a.add(fee))
      // console.log("redeem debug", existed.toString(), amount.toString(), a.toSignificant(6), fee.toSignificant(6), a.add(fee).toSignificant(6))
    }).finally(() => setMortgageInOspLoading(false))
  }, [getOspMortgaged])

  const targetCashInOsp = useCallback((ospAmount: CurrencyAmount<Token>, marketAmount: Fraction, positionId: number | undefined, setCashEarn: CurrencyAmountUpdate) => {
    const existed = getOspMortgaged(positionId)
    const amount = ospAmount.quotient
    if (JSBI.greaterThan(amount, existed)) return
    setMortgageInOspLoading(true)
    mortgagedInOsp(amount, JSBI.subtract(existed, amount)).then(([a, fee]) => {
      const earn = marketAmount.subtract(a.add(fee).asFraction)
      if (earn.lessThan(0)) setCashEarn(CurrencyAmount.fromRawAmount(FIND[currentChainId(chainId)], 0))
      else setCashEarn(CurrencyAmount.fromRawAmount(FIND[currentChainId(chainId)], earn.quotient))
    }).finally(() => setMortgageInOspLoading(false))
  }, [chainId, getOspMortgaged])

  const targetMortgageOutFind = useCallback((findAmount: CurrencyAmount<Token>, positionId: number | undefined, setInOsp: CurrencyAmountUpdate, setFee: CurrencyAmountUpdate) => {
    const existed = getOspMortgaged(positionId)
    const amount = findAmount.quotient
    setMortgageOutFindLoading(true)
    inverseMortgagedInOspByFindAmount(amount, existed).then(([a, fee]) => {
      setInOsp(a)
      setFee(fee)
    }).finally(() => setMortgageOutFindLoading(false))
  }, [getOspMortgaged])

  const targetRedeemOutFind = useCallback((findAmount: CurrencyAmount<Token>, positionId: number | undefined, setInOsp: CurrencyAmountUpdate) => {
    const existed = getOspMortgaged(positionId)
    const amount = findAmount.quotient
    setMortgageOutFindLoading(true)
    inverseRedeemInOspByFindAmount(amount, existed).then((a) => {
      setInOsp(a)
    }).finally(() => setMortgageOutFindLoading(false))
  }, [getOspMortgaged])

  const targetCashOutEarn = useCallback((findAmount: CurrencyAmount<Token>, positionId: number | undefined, osp: TokenData | undefined, setInOsp: CurrencyAmountUpdate) => {
    if (!osp?.pool || !osp?.token) return
    const existed = getOspMortgaged(positionId)
    const amount = findAmount.quotient
    setMortgageOutFindLoading(true)
    inverseCashInOspByFindAmount(amount, osp?.pool, osp?.token, existed).then((a) => {
      setInOsp(a)
    }).finally(() => setMortgageOutFindLoading(false))
  }, [getOspMortgaged])

  const [multiplyInFindLoading, setMultiplyInFindLoading] = useState<boolean>(false)
  // const [multiplyOutOspLoading, setMultiplyOutOspLoading] = useState<boolean>(false)

  const targetMultiplyInFind = useCallback((positionId: number | undefined, osp: TokenData | undefined, findAmount: CurrencyAmount<Token>, setOut: any) => {
    if (!osp?.pool) return
    const existed = getOspMortgaged(positionId)
    const amount = findAmount.quotient
    setMultiplyInFindLoading(true)
    multiplyInFind(osp.pool, FIND[currentChainId(chainId)], amount, existed).then(([f, o, fee]) => {
      setOut(f, o, fee)
    }).finally(() => setMultiplyInFindLoading(false))
  }, [chainId, getOspMortgaged])

  // const targetMultiplyOutOsp = useCallback((osp: TokenData | undefined, ospAmount: CurrencyAmount<Token>, setOutFind: any, setInFind: any, setFee: any) => {
  //   if (!osp?.pool) return
  //   const existed = getOspMortgaged(osp)
  //   const amount = ospAmount.quotient
  //   setMultiplyOutOspLoading(true)
  //   inverseMultiplyInFindByOspAmount(osp.pool, FIND[currentChainId(chainId)], amount, existed).then(([f, o, fee]) => {
  //     setOutFind(f.toSignificant(6))
  //     setInFind(o.toSignificant(6))
  //     setFee(fee.toSignificant(6))
  //   }).finally(() => setMultiplyOutOspLoading(false))
  // }, [chainId, getOspMortgaged])

  return useMemo(() => {
    return {
      positions,
      getOspMortgaged,
      targetMortgageInOsp,
      targetMortgageOutFind,
      targetRedeemInOsp,
      targetRedeemOutFind,
      targetCashInOsp,
      targetCashOutEarn,
      targetMultiplyInFind,
      // targetMultiplyOutOsp,
      positionLoading: positionsLoading,
      mortgageInOspLoading,
      mortgageOutFindLoading,
      multiplyInFindLoading,
      // multiplyOutOspLoading
    }
  }, [positions, getOspMortgaged, targetMortgageInOsp, targetMortgageOutFind, targetRedeemInOsp, targetRedeemOutFind, targetCashInOsp, targetCashOutEarn, targetMultiplyInFind, positionsLoading, mortgageInOspLoading, mortgageOutFindLoading, multiplyInFindLoading])
}
