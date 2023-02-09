import { FIND_NFT_CONTRACT_ADDRESS } from ".";
import { SupportedChainId, supportedChainId2Name } from "./chains";
import { nativeOnChain } from "./token";

export const SCANLINK = {
  // [SupportedChainId.POLYGON]: "https://polygonscan.com/",
  // [SupportedChainId.POLYGON_MUMBAI]: "https://mumbai.polygonscan.com/",
  [SupportedChainId.GOERLI]: "https://goerli.etherscan.io/",
  [SupportedChainId.MAINNET]: "https://etherscan.io/",
}

export const SCANNAME = {
  // [SupportedChainId.POLYGON]: "Polygonscan link",
  // [SupportedChainId.POLYGON_MUMBAI]: "Polygonscan link",
  [SupportedChainId.GOERLI]: "Etherscan link",
  [SupportedChainId.MAINNET]: "Etherscan link",
}

export function getScanLink(chainId: SupportedChainId, hash: string, type: "tx" | "token" | "address" = "tx") {
  return `${SCANLINK[chainId]}${type}/${hash}`;
}

export function getSwapLink(chainId: SupportedChainId, tokenIn?: string, tokenOut?: string) {
  tokenIn = tokenIn?.toLowerCase() === nativeOnChain(chainId).wrapped.address.toLowerCase() ? "ETH" : tokenIn
  tokenOut = tokenOut?.toLowerCase() === nativeOnChain(chainId).wrapped.address.toLowerCase() ? "ETH" : tokenOut
  return `https://app.uniswap.org/#/swap?chain=${supportedChainId2Name(chainId).toLowerCase()}&inputCurrency=${tokenIn}&outputCurrency=${tokenOut}`
}

export function getPoolInfoLink(chainId: SupportedChainId, pool?: string) {
  if (chainId === SupportedChainId.GOERLI || chainId === SupportedChainId.MAINNET) {
    return `https://info.uniswap.org/#/pools/${pool?.toLowerCase()}`
  }
  return `https://info.uniswap.org/#/${supportedChainId2Name(chainId).toLowerCase()}/pools/${pool?.toLowerCase()}`
}

export const OPENSEALINK = {
  // [SupportedChainId.POLYGON]: `https://opensea.io/assets/matic/${FIND_NFT_CONTRACT_ADDRESS[SupportedChainId.POLYGON].toLowerCase()}/`,
  // [SupportedChainId.POLYGON_MUMBAI]: `https://testnets.opensea.io/assets/mumbai/${FIND_NFT_CONTRACT_ADDRESS[SupportedChainId.POLYGON_MUMBAI].toLowerCase()}/`,

  [SupportedChainId.GOERLI]: `https://testnets.opensea.io/assets/goerli/${FIND_NFT_CONTRACT_ADDRESS[SupportedChainId.GOERLI].toLowerCase()}/`,
  [SupportedChainId.MAINNET]: `https://opensea.io/assets/ethereum/${FIND_NFT_CONTRACT_ADDRESS[SupportedChainId.MAINNET].toLowerCase()}/`,
}

export function getOpenseaLink(chainId: SupportedChainId, nft?: string) {
  return `${OPENSEALINK[chainId]}${parseInt(nft || '0', 16)}`
}