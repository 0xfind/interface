import { useMultipleContractSingleData } from "./multicall";
import { useMemo } from "react";
import { UniswapPoolInterface } from "../abis/types/UniswapPool";
import { Interface } from "@ethersproject/abi";
import UniswapPoolABI from "../abis/UniswapPool.json";
import JSBI from "jsbi"

const PoolInterface = new Interface(UniswapPoolABI) as UniswapPoolInterface;

export type PoolSlot0 = {
  sqrtPriceX96: JSBI,
  tick: number,
}

export function usePoolsSlot0(pools: string[]): {
  isLoading: boolean,
  isError: boolean,
  poolSlots: Record<string, PoolSlot0>
} {

  const results = useMultipleContractSingleData(
    pools,
    PoolInterface,
    "slot0",
    [],
  );

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const poolSlots = useMemo(() => {
    if (loading || error || pools.length === 0) return {}
    return results.map(({ result }) => result).reduce((acc, p, currentIndex) => {
      if (!pools[currentIndex] || !p) {
        // console.log([tokenIds, currentIndex, p])
        return acc
      }
      acc[pools[currentIndex]] = {
        sqrtPriceX96: JSBI.BigInt(p['sqrtPriceX96']),
        tick: parseInt(p['tick']),
      }
      return acc
    }, {} as Record<string, PoolSlot0>)
  }, [error, loading, pools, results])

  return useMemo(() => ({
    isLoading: loading,
    isError: error,
    poolSlots
  }), [poolSlots, error, loading])
}
