import { SupportedChainId, } from './chains'

interface BaseChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
}

export type ChainInfoMap = { readonly [chainId: number]: BaseChainInfo }

const CHAIN_INFO: ChainInfoMap = {
  // [SupportedChainId.POLYGON]: {
  //   bridge: 'https://wallet.polygon.technology/bridge',
  //   docs: 'https://polygon.io/',
  //   explorer: 'https://polygonscan.com/',
  //   infoLink: 'https://info.harberger.money/#/polygon/',
  //   label: 'Polygon',
  //   nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
  // },
  // [SupportedChainId.POLYGON_MUMBAI]: {
  //   bridge: 'https://wallet.polygon.technology/bridge',
  //   docs: 'https://polygon.io/',
  //   explorer: 'https://mumbai.polygonscan.com/',
  //   infoLink: 'https://info.harberger.money/#/polygon/',
  //   label: 'Polygon Mumbai',
  //   nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
  // },
  [SupportedChainId.GOERLI]: {
    docs: 'https://docs.harberger.money/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.harberger.money/#/',
    label: 'Görli',
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
  },
  [SupportedChainId.MAINNET]: {
    docs: 'https://docs.harberger.money/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.harberger.money/#/',
    label: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
}

export function getChainInfo(chainId: any): any {
  if (chainId) {
    return CHAIN_INFO[chainId] ?? undefined
  }
  return undefined
}
