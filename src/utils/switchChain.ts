import { Connector } from '@web3-react/types'

import { coinbaseWalletConnection, injectedConnection, networkConnection, walletConnectConnection } from '../connectors'
import { getChainInfo } from '../constants/chainInfo'
import { SupportedChainId } from '../constants/chains'

function getRpcUrls(chainId: SupportedChainId): [string] {
  switch (chainId) {
    // case SupportedChainId.POLYGON:
    //   return ['https://polygon-rpc.com/']
    // case SupportedChainId.POLYGON_MUMBAI:
    //   return ['https://rpc-mumbai.maticvigil.com']
    case SupportedChainId.GOERLI:
      return ['https://rpc.goerli.mudit.blog/']
    case SupportedChainId.MAINNET:
      return ['https://cloudflare-eth.com']
    default:
  }
  // Our API-keyed URLs will fail security checks when used with external wallets.
  throw new Error('RPC URLs must use public endpoints')
}

export function isChainAllowed(connector: Connector, chainId: number) {
  switch (connector) {
    case injectedConnection.connector:
    case coinbaseWalletConnection.connector:
    case walletConnectConnection.connector:
    case networkConnection.connector:
    default:
      return false
  }
}

export const switchChain = async (connector: Connector, chainId: SupportedChainId) => {
  if (connector === walletConnectConnection.connector || connector === networkConnection.connector) {
    await connector.activate(chainId)
  } else {
    const info = getChainInfo(chainId)
    const addChainParameter = {
      chainId,
      chainName: info.label,
      rpcUrls: getRpcUrls(chainId),
      nativeCurrency: info.nativeCurrency,
      blockExplorerUrls: [info.explorer],
    }
    await connector.activate(addChainParameter)
  }
}
