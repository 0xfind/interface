import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { useMemo } from "react";
import { currentChainId } from "../constants/chains";
import { genBlocknumberClient, genFindClient, genUniswapClient } from "../graphql/client";
import { useAppSelector } from "../state/hooks";

export function useBlockNumberClient(): ApolloClient<NormalizedCacheObject> {
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId));
  return useMemo(() => genBlocknumberClient(chainId), [chainId])
}

export function useFindClient(): ApolloClient<NormalizedCacheObject> {
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId));
  return useMemo(() => genFindClient(chainId), [chainId])
}

export function useUniswapClient(): ApolloClient<NormalizedCacheObject> {
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId));
  return useMemo(() => genUniswapClient(chainId), [chainId])
}

export default function useGraphqlClient() {
  const blocknumberClient = useBlockNumberClient()
  const findClient = useFindClient()
  const uniswapClient = useUniswapClient()

  return useMemo(() => ({
    blocknumberClient,
    findClient,
    uniswapClient,
  }), [blocknumberClient, findClient, uniswapClient])
}