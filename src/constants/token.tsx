import {DEFAULT_CHAINID, SupportedChainId} from "./chains";
import {Ether, NativeCurrency, Percent, Token, WETH9} from "@uniswap/sdk-core";
import { FINDCoinIcon, USDTCoinIcon, WETHCoinIcon, DAICoinIcon, MATICCoinIcon } from "../components/Icons";
import { ReactElement } from "react";
import { FeeAmount } from "@uniswap/v3-sdk";

export type ChainToken = Record<SupportedChainId, Token>

export const WETH: ChainToken = {
  [SupportedChainId.GOERLI]: WETH9[SupportedChainId.GOERLI],
  [SupportedChainId.MAINNET]: WETH9[SupportedChainId.MAINNET],
};

export const DAI: ChainToken = {
  [SupportedChainId.GOERLI]: new Token(
    SupportedChainId.GOERLI,
    "0xdc31Ee1784292379Fbb2964b3B9C4124D8F89C60",
    18,
    "DAI",
    "Dai Stablecoin"
  ),
  [SupportedChainId.MAINNET]: new Token(
    SupportedChainId.MAINNET,
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    18,
    "DAI",
    "Dai Stablecoin"
  ),
};

// export const MATIC: ChainToken = {
//   [SupportedChainId.POLYGON]: new Token(
//     SupportedChainId.POLYGON,
//     "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
//     18,
//     "MATIC",
//     "Wrapped MATIC"
//   ),
//   [SupportedChainId.POLYGON_MUMBAI]: new Token(
//     SupportedChainId.POLYGON_MUMBAI,
//     "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
//     18,
//     "MATIC",
//     "Wrapped MATIC"
//   ),
//   [SupportedChainId.GOERLI]: new Token(
//     SupportedChainId.GOERLI,
//     "0x0000000000000000000000000000000000001010",
//     18,
//     "MATIC",
//     "Wrapped MATIC"
//   ),
//   [SupportedChainId.MAINNET]: new Token(
//     SupportedChainId.MAINNET,
//     "0x0000000000000000000000000000000000001010",
//     18,
//     "MATIC",
//     "Wrapped MATIC"
//   ),
// };

export const USDT: ChainToken = {
  [SupportedChainId.GOERLI]: new Token(
    SupportedChainId.GOERLI,
    "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c",
    6,
    "USDT",
    "Tether USD"
  ),
  [SupportedChainId.MAINNET]: new Token(
    SupportedChainId.MAINNET,
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    6,
    "USDT",
    "Tether USD"
  ),
};

export const FIND: ChainToken = {
  [SupportedChainId.GOERLI]: new Token(
    SupportedChainId.GOERLI,
    "0x2F9CAB5e879330Ac548A8EE9375C896Ff37b8E0a",
    18,
    "FIND",
    "Find"
  ),
  [SupportedChainId.MAINNET]: new Token(
    SupportedChainId.MAINNET,
    "0x2F9CAB5e879330Ac548A8EE9375C896Ff37b8E0a",
    18,
    "FIND",
    "Find"
  ),
}

export const DEFAULT_TOKEN = WETH

export const DEFAULT_CHAINID_TOKEN = DEFAULT_TOKEN[DEFAULT_CHAINID as SupportedChainId]

export enum SelectToken {
  WETH = "WETH",
  DAI = "DAI",
  USDT = "USDT",
  MATIC = "MATIC",
  FIND = "FIND",
}

export const SelectTokenIDs = [
  SelectToken.FIND,
  SelectToken.DAI,
  SelectToken.USDT,
  SelectToken.WETH,
  SelectToken.MATIC,
]

const chainSelectTokenIDS: Record<SupportedChainId, SelectToken[]> = {
  [SupportedChainId.MAINNET]: [
    SelectToken.WETH,
    SelectToken.FIND,
    SelectToken.DAI,
    SelectToken.USDT,
  ],
  [SupportedChainId.GOERLI]: [
    SelectToken.WETH,
    SelectToken.FIND,
    SelectToken.DAI,
    SelectToken.USDT,
  ],
}

export function getChainSelectToken(chainId: SupportedChainId) {
  return chainSelectTokenIDS[chainId]
}

export const SelectTokenChainToFindPoolFee: Record<SelectToken, Record<SupportedChainId, FeeAmount>> = {
  [SelectToken.DAI]: {
    [SupportedChainId.GOERLI]: FeeAmount.LOW,
    [SupportedChainId.MAINNET]: FeeAmount.MEDIUM,
  },
  [SelectToken.USDT]: {
    [SupportedChainId.GOERLI]: FeeAmount.MEDIUM,
    [SupportedChainId.MAINNET]: FeeAmount.MEDIUM,
  },
} as Record<SelectToken, Record<SupportedChainId, FeeAmount>>

export const LOW_AUTO_SLIPPAGE = new Percent(10, 10_000)
export const HIGH_SLIPPAGE = new Percent(1000, 10_000)
export const MEDIUM_SLIPPAGE = new Percent(500, 10_000)
export const ZERO_SLIPPAGE = new Percent(0, 10_000)

export const SelectTokenSlippage: Record<SelectToken, Percent> = {
  [SelectToken.FIND]: ZERO_SLIPPAGE,
  [SelectToken.DAI]: MEDIUM_SLIPPAGE,
  [SelectToken.USDT]: MEDIUM_SLIPPAGE,
  [SelectToken.WETH]: LOW_AUTO_SLIPPAGE,
  [SelectToken.MATIC]: MEDIUM_SLIPPAGE,
}

export const getSelectToken: (name: SelectToken) => ChainToken = (name: SelectToken) => {
  switch (name) {
    case SelectToken.WETH:
      return WETH;
    case SelectToken.DAI:
      return DAI;
    case SelectToken.USDT:
      return USDT;
    case SelectToken.FIND:
      return FIND;
    default:
      return FIND;
  }
}

export function getSelectTokenByAddress(chainId: SupportedChainId, address: string) {
  switch (address.toLowerCase()) {
    case WETH[chainId].address.toLowerCase():
      return SelectToken.WETH;
    case DAI[chainId].address.toLowerCase():
      return SelectToken.DAI;
    case USDT[chainId].address.toLowerCase():
      return SelectToken.USDT;
    case FIND[chainId].address.toLowerCase():
      return SelectToken.FIND;
    default:
      return SelectToken.FIND
  }
}

export const SelectTokenIcon: Record<SelectToken, ReactElement> = {
  [SelectToken.USDT]: <USDTCoinIcon sx={{ fontSize: "24px" }} />,
  [SelectToken.WETH]: <WETHCoinIcon sx={ { fontSize: "24px" } } />,
  [SelectToken.FIND]: <FINDCoinIcon sx={ { fontSize: "24px" } } />,
  [SelectToken.DAI]: <DAICoinIcon sx={ { fontSize: "24px" } } />,
  [SelectToken.MATIC]: <MATICCoinIcon sx={ { fontSize: "24px" } } />,
}

export const getSelectTokenName: (chainId: SupportedChainId, token?: string) => string | undefined = (chainId: SupportedChainId, token?: string) => {
  if (token !== SelectToken.WETH) {
    return token
  }
  if (chainId === SupportedChainId.MAINNET || chainId === SupportedChainId.GOERLI) {
    return "ETH"
  }
  return token
}

// function isMatic(
//   chainId: number
// ): chainId is SupportedChainId.POLYGON | SupportedChainId.POLYGON_MUMBAI {
//   return (
//     chainId === SupportedChainId.POLYGON_MUMBAI ||
//     chainId === SupportedChainId.POLYGON
//   );
// }

// export class MaticNativeCurrency extends NativeCurrency {
//   equals(other: Currency): boolean {
//     return other.isNative && other.chainId === this.chainId;
//   }

//   get wrapped(): Token {
//     if (!isMatic(this.chainId)) throw new Error("Not matic");
//     const wrapped = MATIC[this.chainId];
//     return wrapped;
//   }

//   public constructor(chainId: number) {
//     if (!isMatic(chainId)) throw new Error("Not matic");
//     super(chainId, 18, "MATIC", "Polygon Matic");
//   }
// }

export const WRAPPED_NATIVE_CURRENCY: { [chainId: number]: Token | undefined } = {
  ...(WETH9 as Record<SupportedChainId, Token>),
  // [SupportedChainId.POLYGON]: new Token(
  //   SupportedChainId.POLYGON,
  //   '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  //   18,
  //   'WMATIC',
  //   'Wrapped MATIC'
  // ),
  // [SupportedChainId.POLYGON_MUMBAI]: new Token(
  //   SupportedChainId.POLYGON_MUMBAI,
  //   '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
  //   18,
  //   'WMATIC',
  //   'Wrapped MATIC'
  // ),
}

export class ExtendedEther extends Ether {
  public get wrapped(): Token {
    const wrapped = WRAPPED_NATIVE_CURRENCY[this.chainId]
    if (wrapped) return wrapped
    throw new Error('Unsupported chain ID')
  }

  private static _cachedExtendedEther: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): ExtendedEther {
    return this._cachedExtendedEther[chainId] ?? (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId))
  }
}

const cachedNativeCurrency: { [chainId: number]: NativeCurrency | Token } = {}

export function nativeOnChain(chainId: number): NativeCurrency | Token {
  if (cachedNativeCurrency[chainId]) return cachedNativeCurrency[chainId]
  let nativeCurrency: NativeCurrency | Token
  // if (isMatic(chainId)) {
  //   nativeCurrency = new MaticNativeCurrency(chainId)
  // } else {
  //   nativeCurrency = ExtendedEther.onChain(chainId)
  // }
  nativeCurrency = ExtendedEther.onChain(chainId)
  return (cachedNativeCurrency[chainId] = nativeCurrency)
}
