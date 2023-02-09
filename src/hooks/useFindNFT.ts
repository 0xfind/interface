import { useMemo } from "react";
import { NEVER_RELOAD, useSingleCallResult } from "./multicall";
import { useFindNFTContract } from "./useContract";

const STARTS_WITH = 'data:application/json;base64,'

function parseTokenURI (result: [string]) {
  if (!result) return undefined
  const [tokenURI] = result
  if (!tokenURI || !tokenURI.startsWith(STARTS_WITH))
    return undefined

  try {
    const json = JSON.parse(atob(tokenURI.slice(STARTS_WITH.length)))
    return json?.image
  } catch (error) {
    console.log(error)
    return undefined
  }
}

function useFindNFT(oNFTId?: string, cNFTId?: string) : {
  loading: boolean, cnftURI: string, onftURI: string
} {
  const nftContract = useFindNFTContract()
  const onft = useSingleCallResult(nftContract, "tokenURI", [oNFTId || '0'], {
    ...NEVER_RELOAD,
    gasRequired: 3_000_000,
  })
  const cnft = useSingleCallResult(nftContract, "tokenURI", [cNFTId || '0'], {
    ...NEVER_RELOAD,
    gasRequired: 3_000_000,
  })
  return useMemo(() => ({
    onftURI: parseTokenURI(onft.result as any),
    cnftURI: parseTokenURI(cnft.result as any),
    loading: cnft.loading || onft.loading,
  }), [cnft.loading, cnft.result, onft.loading, onft.result])
}

export default useFindNFT;