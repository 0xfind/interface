import { useMemo } from "react";
import { UNISWAP_THEGRAPH_BEGIN_BLOCKNUMBER } from "../constants";
import { currentChainId, SupportedChainId } from "../constants/chains";
import { useGetBlocksQuery } from "../graphql/blocknumber/generated";
import { useAppSelector } from "../state/hooks";
import { useBlockNumberClient } from "./useGraphqlClient";

function cmp (block: string, chainId: SupportedChainId): any {
  if (!block) return undefined
  if (parseInt(block) < UNISWAP_THEGRAPH_BEGIN_BLOCKNUMBER[currentChainId(chainId)]) return UNISWAP_THEGRAPH_BEGIN_BLOCKNUMBER[currentChainId(chainId)].toString()
  return block
}

export function useBlockNumbers(timestamps: [number, number, number]) : {
  isLoading: boolean;
  blocks?: string[];
} {
  const chainId = useAppSelector((state) => state.application.chainId);
  const blocknumberClient = useBlockNumberClient()
  const { data, loading } = useGetBlocksQuery({
    variables: {
      timestamp24G: timestamps[0],
      timestamp24L: timestamps[0] + 600,
      timestamp48G: timestamps[1],
      timestamp48L: timestamps[1] + 600,
      timestampWeekG: timestamps[2],
      timestampWeekL: timestamps[2] + 600,
    },
    client: blocknumberClient,
  })
  const [block24, block48, blockWeek] = useMemo(() => {
    if (data?.block24?.length !== 1 || data?.block48?.length !== 1 || data?.blockWeek?.length !== 1) return []
    return [cmp(data?.block24[0].number, chainId), cmp(data?.block48[0].number, chainId), cmp(data?.blockWeek[0].number, chainId)]
  }, [data?.block24, data?.block48, data?.blockWeek, chainId])
  return useMemo(() => {
    return {
      isLoading: loading,
      blocks: [block24, block48, blockWeek]
    }
  }, [block24, block48, blockWeek, loading])
}