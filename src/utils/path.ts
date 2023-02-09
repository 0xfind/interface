import { Token } from "@uniswap/sdk-core";
import { FeeAmount } from "@uniswap/v3-sdk";
import { SupportedChainId } from "../constants/chains";
import { FIND, getSelectTokenByAddress, SelectTokenChainToFindPoolFee, WETH } from "../constants/token";

const FEE_SIZE = 3;

export function encodePath(path: string[], fees: number[]): string {
  if (path.length !== fees.length + 1) {
    throw new Error("path/fee lengths do not match");
  }

  let encoded = "0x";
  for (let i = 0; i < fees.length; i++) {
    // 20 byte encoding of the address
    encoded += path[i].slice(2);
    // 3 byte encoding of the fee
    encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, "0");
  }
  // encode the final token
  encoded += path[path.length - 1].slice(2);
  return encoded.toLowerCase()
}

export function getPathToFind(chainId: SupportedChainId, inToken: Token, exactOutput: boolean) : string {
  if (inToken.address.toLowerCase() === FIND[chainId].address.toLowerCase()) {
    return FIND[chainId].address.toLowerCase()
  }
  const path: string[] = []
  const fees: FeeAmount[] = []
  if (inToken.address.toLowerCase() !== WETH[chainId].address.toLowerCase()) {
    const sid = getSelectTokenByAddress(chainId, inToken.address)
    path.push(inToken.address)
    fees.push(SelectTokenChainToFindPoolFee[sid][chainId])
  }
  path.push(WETH[chainId].address)
  path.push(FIND[chainId].address)
  fees.push(FeeAmount.LOWEST)

  if (exactOutput) {
    path.reverse()
    fees.reverse()
  }

  return encodePath(path, fees)
}


