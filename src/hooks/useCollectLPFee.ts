import {useSingleContractMultipleData} from "./multicall";
import { useFindEarnContract } from "./useContract";
import {useMemo} from "react";
import {formatUnits} from "@ethersproject/units";

export type CollectLPFee = {
  createNFTFee: number,
  ownerNFTFee: number,
}

export function useCollectLPFee(tokenIds: string[]): {
  isLoading: boolean,
  isError: boolean,
  collectLPFee: Record<string, CollectLPFee>
} {
  const findEarn = useFindEarnContract()
  const results = useSingleContractMultipleData(
    findEarn,
    "collectOspUniswapLPFee",
    tokenIds.map((id) => [id]),
    { gasRequired: 2_000_000 }
  )
  
  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const collectLPFee = useMemo(() => {
    if (loading || error || tokenIds.length === 0) return {}
    return results.map(({result}) => result).reduce((acc, p, currentIndex) => {
      if (!tokenIds[currentIndex] || !p) {
        // console.log([tokenIds, currentIndex, p])
        return acc
      }
      acc[tokenIds[currentIndex]] = {
        createNFTFee: parseFloat(formatUnits(p['cAmount'], 18)),
        ownerNFTFee: parseFloat(formatUnits(p['oAmount'], 18)),
      }
      return acc
    }, {} as Record<string, CollectLPFee>)
  }, [error, loading, results, tokenIds])

  return useMemo(() => ({
    isLoading: loading,
    isError: error,
    collectLPFee
  }), [collectLPFee, error, loading])
}