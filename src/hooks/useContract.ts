import { Contract } from "@ethersproject/contracts";
import { useMemo } from "react";

import ERC20_ABI from "../abis/erc20.json";
import UniswapPool_ABI from "../abis/UniswapPool.json";
import FindFactory_ABI from "../abis/Factory.json";
import FindEarn_ABI from "../abis/Earn.json";
import FindNFT_ABI from "../abis/FindNFT.json";
import FindMortgage_ABI from "../abis/Mortgage.json";

import {Erc20, Factory, Earn, FindNFT, Mortgage, UniswapPool} from "../abis/types";
import { UniswapInterfaceMulticall } from "../abis/types";
import Multicall_ABI from "../abis/UniswapInterfaceMulticall.json";
import {
  MULTICALL_CONTRACT_ADDRESS, FIND_NFT_CONTRACT_ADDRESS, FIND_FACTORY_CONTRACT_ADDRESS, FIND_MORTGAGE_CONTRACT_ADDRESS, FIND_EARN_CONTRACT_ADDRESS,
} from "../constants";
import {getContract} from "../utils";
import useActiveWeb3React from "./useActiveWeb3React";
import {currentChainId} from "../constants/chains";

export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any,
  withSignerIfPossible = true,
  useJsonProvider?: boolean
): T | null {
  const { provider: walletProvider, account, chainId } = useActiveWeb3React()
  const provider = useMemo(() => (useJsonProvider ? undefined : walletProvider), [useJsonProvider, walletProvider])
  return useMemo(() => {
    if (!addressOrAddressMap || !ABI) return null;
    let address: string | undefined;
    if (typeof addressOrAddressMap === "string") address = addressOrAddressMap;
    else address = addressOrAddressMap[currentChainId(chainId)];
    if (!address) return null;
    try {
      return getContract(
        address,
        ABI,
        provider,
        withSignerIfPossible && account ? account : undefined,
        chainId
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [
    addressOrAddressMap,
    ABI,
    provider,
    chainId,
    withSignerIfPossible,
    account,
  ]) as T;
}

export function useTokenContract(
  tokenAddress?: string,
  withSignerIfPossible?: boolean
) {
  return useContract<Erc20>(
    tokenAddress,
    ERC20_ABI,
    withSignerIfPossible
  ) as Erc20;
}

export function useUniswapPoolContract(
  poolAddress?: string,
  withSignerIfPossible?: boolean
) {
  return useContract<UniswapPool>(
    poolAddress,
    UniswapPool_ABI,
    withSignerIfPossible
  ) as UniswapPool;
}

export function useFindFactoryContract(withSignerIfPossible?: boolean) {
  return useContract<Factory>(
    FIND_FACTORY_CONTRACT_ADDRESS,
    FindFactory_ABI["abi"],
    withSignerIfPossible
  ) as Factory;
}

export function useFindEarnContract(withSignerIfPossible?: boolean) {
  return useContract<Earn>(
    FIND_EARN_CONTRACT_ADDRESS,
    FindEarn_ABI["abi"],
    withSignerIfPossible
  ) as Earn;
}

export function useInterfaceMulticall() {
  return useContract<UniswapInterfaceMulticall>(
    MULTICALL_CONTRACT_ADDRESS,
    Multicall_ABI["abi"],
    false,
    true // watching for the json provider
  ) as UniswapInterfaceMulticall;
}

export function useFindMortgageContract(withSignerIfPossible?: boolean) {
  return useContract<Mortgage>(
    FIND_MORTGAGE_CONTRACT_ADDRESS,
    FindMortgage_ABI["abi"],
    withSignerIfPossible
  ) as Mortgage;
}

export function useFindNFTContract() {
  return useContract<FindNFT>(
    FIND_NFT_CONTRACT_ADDRESS,
    FindNFT_ABI["abi"],
    false,
    true
  ) as FindNFT;
}
