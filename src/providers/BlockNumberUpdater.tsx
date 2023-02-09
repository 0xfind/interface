import { ReactNode, useState, useCallback, useEffect, useMemo } from "react";
import useActiveWeb3React from "../hooks/useActiveWeb3React";
import useIsWindowVisible from "../hooks/useIsWindowVisible";
import { BlockNumberContext } from "../utils/blocknumber";

function BlockNumberProvider({ children }: { children: ReactNode }) {
  const { chainId: activeChainId, provider } = useActiveWeb3React()
  const [{ chainId, block }, setChainBlock] = useState<{ chainId?: number; block?: number }>({ chainId: activeChainId })

  const onBlock = useCallback(
    (block: number) => {
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId === activeChainId) {
          if (!chainBlock.block || chainBlock.block < block) {
            return { chainId: activeChainId, block }
          }
        }
        return chainBlock
      })
    },
    [activeChainId, setChainBlock]
  )

  const windowVisible = useIsWindowVisible()
  useEffect(() => {
    if (provider && activeChainId && windowVisible) {
      // If chainId hasn't changed, don't clear the block. This prevents re-fetching still valid data.
      setChainBlock((chainBlock) => (chainBlock.chainId === activeChainId ? chainBlock : { chainId: activeChainId }))

      provider
        .getBlockNumber()
        .then(onBlock)
        .catch((error) => {
          console.error(`Failed to get block number for chainId ${activeChainId}`, error)
        })

      provider.on('block', onBlock)
      return () => {
        provider.removeListener('block', onBlock)
      }
    }
    return undefined
  }, [activeChainId, provider, onBlock, setChainBlock, windowVisible, chainId])

  const value = useMemo(
    () => ({
      value: chainId === activeChainId ? block : undefined,
      fastForward: (block: number) => setChainBlock({ chainId: activeChainId, block }),
    }),
    [activeChainId, block, chainId]
  )
  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}


export default BlockNumberProvider;