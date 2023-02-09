import { useWeb3React } from '@web3-react/core'
import { useCallback } from 'react'
import { SupportedChainId } from '../constants/chains'
import { switchChain } from '../utils/switchChain'

export default function useSelectChain() {
  const { connector } = useWeb3React()

  return useCallback(
    async (targetChain: SupportedChainId) => {
      if (!connector) return
      try {
        await switchChain(connector, targetChain)
      } catch (error) {
        console.error('Failed to switch networks', error)
      }
    },
    [connector]
  )
}
