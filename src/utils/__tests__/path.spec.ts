import { encodeRouteToPath, encodeSqrtRatioX96, FeeAmount, Pool, Route } from "@uniswap/v3-sdk"
import { SupportedChainId } from "../../constants/chains"
import { DAI, FIND, WETH } from "../../constants/token"
import { getPathToFind } from "../path"

it("test order path", () => {
  const chainId = SupportedChainId.GOERLI

  const find = getPathToFind(chainId, FIND[chainId], false)
  const wethToFindOut = getPathToFind(chainId, WETH[chainId], true)
  const otherToFind = getPathToFind(chainId, DAI[chainId], false)

  const pool = new Pool(FIND[chainId], WETH[chainId], FeeAmount.LOWEST, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const otherPool = new Pool(DAI[chainId], WETH[chainId], FeeAmount.LOWEST, encodeSqrtRatioX96(1, 1), 0, 0, [])
  const route = new Route([pool], FIND[chainId], WETH[chainId])
  const findToWETH = encodeRouteToPath(route, false)

  const otherRoute = new Route([otherPool, pool], DAI[chainId], FIND[chainId])
  const daiToFind = encodeRouteToPath(otherRoute, false)

  expect(find).toEqual(FIND[chainId].address.toLowerCase())
  expect(wethToFindOut).toEqual(findToWETH)
  expect(otherToFind).toEqual(daiToFind)
})

export { }