import { SupportedChainId } from "./chains";

export enum CHAIN_SUBGRAPH {
  BLOCKNUMBER,
  UNISWAP,
  FIND,
}

export const BLOCKNUMBER_CHAIN_SUBGRAPH_URL: Record<number, string> = {
  // [SupportedChainId.POLYGON]:
  //   "https://api.thegraph.com/subgraphs/name/ianlapham/polygon-blocks",
  // [SupportedChainId.POLYGON_MUMBAI]:
  //   "https://api.thegraph.com/subgraphs/name/iliaazhel/mumbai-blocks",
  [SupportedChainId.GOERLI]:
  "https://api.thegraph.com/subgraphs/name/projecttwelve/goerli-blocks",
  [SupportedChainId.MAINNET]: 
  "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks",
};

export const FIND_CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.GOERLI]: 
    "https://api.thegraph.com/subgraphs/name/0xfind/find-v1-goerli",
  [SupportedChainId.MAINNET]: 
    "https://api.thegraph.com/subgraphs/name/0xfind/find-v1-eth",
};

export const UNISWAP_CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.GOERLI]:
    "https://api.thegraph.com/subgraphs/name/0xfind/uniswap-v3-goerli-2",
  [SupportedChainId.MAINNET]:
    "https://api.thegraph.com/subgraphs/name/0xfind/uniswap-v3-eth",
};

export const CHAIN_SUBGRAPH_URL: Record<CHAIN_SUBGRAPH, Record<number, string>> = {
  [CHAIN_SUBGRAPH.BLOCKNUMBER]: BLOCKNUMBER_CHAIN_SUBGRAPH_URL,
  [CHAIN_SUBGRAPH.UNISWAP]: UNISWAP_CHAIN_SUBGRAPH_URL,
  [CHAIN_SUBGRAPH.FIND]: FIND_CHAIN_SUBGRAPH_URL,
};