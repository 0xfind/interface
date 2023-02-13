import { V1SupportChainId } from "../state/service/generatedSignatureApi";

export enum SupportedChainId {
  GOERLI = 5,
  MAINNET = 1,
}

export const DEFAULT_CHAINID = parseInt((process.env.REACT_APP_DEFAULT_CHAINID || SupportedChainId.MAINNET.toString())) as any

export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = [
  SupportedChainId.GOERLI,
  SupportedChainId.MAINNET,
];

export const SupportedNetworkish = {
  // [SupportedChainId.POLYGON]: "matic",
  // [SupportedChainId.POLYGON_MUMBAI]: "maticmum",

  [SupportedChainId.GOERLI]: "goerli",
  [SupportedChainId.MAINNET]: "homestead",
}

export const SupportedChainIdName: Record<SupportedChainId, V1SupportChainId> = {
  // [SupportedChainId.POLYGON]: "POLYGON",
  // [SupportedChainId.POLYGON_MUMBAI]: "POLYGON_MUMBAI",
  [SupportedChainId.GOERLI]: "GOERLI",
  [SupportedChainId.MAINNET]: "MAINNET",
}

export const SupportedChainName: Record<V1SupportChainId, SupportedChainId> = {
  // "POLYGON": SupportedChainId.POLYGON,
  // "POLYGON_MUMBAI": SupportedChainId.POLYGON_MUMBAI,
  "GOERLI": SupportedChainId.GOERLI,
  "MAINNET": SupportedChainId.MAINNET,
} as any

export const supportedChainId2Name = (chainId: SupportedChainId) => SupportedChainIdName[chainId] as V1SupportChainId
export const supportedChainName2Id = (chainName: V1SupportChainId) => SupportedChainName[chainName] as SupportedChainId

export const currentChainId: (chainId?: any) => SupportedChainId = (chainId?: any) => {
  if (!chainId || !ALL_SUPPORTED_CHAIN_IDS.includes(chainId)) return DEFAULT_CHAINID
  return chainId
}
