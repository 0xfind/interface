import { getAddress } from "@ethersproject/address";
import { AddressZero } from "@ethersproject/constants";
import { Contract } from "@ethersproject/contracts";
import { JsonRpcSigner, BaseProvider, AlchemyProvider, JsonRpcProvider } from "@ethersproject/providers";
import numbro from "numbro";
import JSBI from "jsbi";
import {ALL_SUPPORTED_CHAIN_IDS, currentChainId, SupportedChainId, SupportedNetworkish} from "../constants/chains";
import {ALCHEMY_KEY} from "../constants/alchemy";
import * as dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { CurrencyAmount, Fraction, Percent, Token } from "@uniswap/sdk-core";
import { Pool, FeeAmount, Tick } from "@uniswap/v3-sdk";
import { Pool as UniswapPool } from "../graphql/uniswap/generated";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { BigNumber } from "ethers";
import { FIND, LOW_AUTO_SLIPPAGE } from "../constants/token";
import { initSqrtPriceX96FindToOsp, initSqrtPriceX96OspToFind, initTickFindToOsp, initTickOspToFind } from "./mortgage";

dayjs.extend(utc)
dayjs.extend(localizedFormat)

export function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

function getSigner(library: JsonRpcProvider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

function getProviderOrSigner(
  provider: JsonRpcProvider,
  account?: string
): JsonRpcProvider | JsonRpcSigner {
  return account ? getSigner(provider, account) : provider;
}

const routerProviders = new Map<SupportedChainId, BaseProvider>()

export function getJsonProvider(chainId: SupportedChainId): BaseProvider {
  const provider = routerProviders.get(chainId)
  if (provider) return provider

  if (ALL_SUPPORTED_CHAIN_IDS.includes(chainId)) {
    const provider = new AlchemyProvider(SupportedNetworkish[chainId], ALCHEMY_KEY)
    provider.pollingInterval = 15_000;
    routerProviders.set(chainId, provider)
    return provider
  }
  throw new Error(`Does not support this chain (chainId: ${chainId}).`)
}

export function getContract(
  address: string,
  ABI: any,
  provider?: JsonRpcProvider,
  account?: string,
  chainId?: SupportedChainId,
): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  if (!provider) {
    return new Contract(
      address,
      ABI,
      getJsonProvider(currentChainId(chainId))
    );
  }

  return new Contract(
    address,
    ABI,
    getProviderOrSigner(provider, account) as any
  );
}

export const formatDollarAmount = (
  num: number | undefined,
  spaceSeparated = true,
  digits = 2,
  round = true,
) => {
  if (num === 0 || !num) return "$ 0.000";
  if (num < 0.001 && digits <= 3) {
    return "<$ 0.001";
  }

  return numbro(num).formatCurrency({
    average: round,
    mantissa: num > 1000 ? 2 : digits,
    spaceSeparatedCurrency: spaceSeparated,
    abbreviations: {
      million: "M",
      billion: "B",
    },
  });
};

export const formatPriceChange = (num: number) => {
  if (num === 0 || !num) return "0.00%";
  return (
    numbro(num).format({
      mantissa: 2,
      abbreviations: {
        million: "M",
        billion: "B",
      },
    }) + "%"
  );
};

export const formatNumber = (num: number | undefined, mantissa = 2) => {
  if (num === 0 || !num) return "0";
  return numbro(num).format({
    mantissa,
    abbreviations: {
      million: "M",
      billion: "B",
      trillion: 'T'
    },
  });
};

export const formatJSBI = (f: JSBI) => formatNumber(parseFloat(formatUnits(BigNumber.from(f), 18)))

export const formatPercent = (num: number | undefined) => {
  if (num === 0 || !num) return "0.00%";
  return numbro(num).format("0.00%");
};

export const formatX18: (n?: string) => string = (num?: string) => {
  const numBigInt = JSBI.BigInt(num || '0')
  return new Fraction(numBigInt, JSBI.BigInt(1e18)).toSignificant(6)
}

export const formatTotalAmountWithoutSymbol = (
  num: number | undefined,
  integers = false
) => {
  if (!num || num === 0) return "0.00";
  if (num < 0.01) {
    return "<0.01";
  }
  if (integers) return numbro(num).format("0 a");
  return numbro(num).format("4 a");
};

export const formatTimeStampLocalized = (t: string) => {
  return dayjs.unix(parseInt(t)).format("MMM D, YYYY")
}

export const getStorageToken: () => string | null = () => {
  const token = localStorage.getItem("token")
  if (token) return `Bearer ${token}`
  return null
}

export const setStorageToken: (token: string) => void = (token: string) => {
  localStorage.setItem("token", token)
}

export const getStorageOwnerOrg: () => string = () => {
  return localStorage.getItem("owner_org") || ""
}

export const setStorageOwnerOrg: (org: string) => void = (org) => {
  localStorage.setItem("owner_org", org)
}

export const setAuthHeaders = (headers: Headers) => {
  const token = window.localStorage.getItem("token") as string
  try {
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  } catch (e) {}
  return headers;
}

export function queryTimes() {
  return [dayjs.utc().subtract(1, 'day').unix(), dayjs.utc().subtract(7, 'day').unix()]
}

export function getDeltaTimestamps(): [number, number, number] {
  const utcCurrentTime = dayjs.utc()
  const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
  const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix()
  const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix()
  return [t1, t2, tWeek]
}

export const getPercentChange = (valueNow: string | undefined, value24HoursAgo: string | undefined): number => {
  if (valueNow && value24HoursAgo) {
    const change = ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) / parseFloat(value24HoursAgo)) * 100
    if (isFinite(change)) return change
  }
  return 0
}


export const get2DayChange = (valueNow: string, value24HoursAgo: string, value48HoursAgo: string): [number, number] => {
  // get volume info for both 24 hour periods
  const currentChange = parseFloat(valueNow) - parseFloat(value24HoursAgo)
  const previousChange = parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo)
  const adjustedPercentChange = ((currentChange - previousChange) / previousChange) * 100
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0]
  }
  return [currentChange, adjustedPercentChange]
}

export function getLogo(projectId: string) {
  const split = projectId.split('/')
  return `https://avatars.githubusercontent.com/u/${split.length === 3 ? split[1] : split[0]}?s=30&v=4`;
}

export function genLocalPool(chainId: SupportedChainId, dataPool?: UniswapPool): Pool | undefined {
  if (!dataPool) return
  const tokenA = new Token(chainId, dataPool.token0.id, parseInt(dataPool.token0.decimals), dataPool.token0.symbol, dataPool.token0.name)
  const tokenB = new Token(chainId, dataPool.token1.id, parseInt(dataPool.token1.decimals), dataPool.token1.symbol, dataPool.token1.name)
  const ticks = dataPool.ticks.map((tick) => {
    return new Tick({ index: parseInt(tick.tickIdx), liquidityGross: JSBI.BigInt(tick.liquidityGross), liquidityNet: JSBI.BigInt(tick.liquidityNet) })
  }).sort((a, b) => (a.index - b.index))

  const isFindToOsp = tokenA.equals(FIND[chainId])
  if (dataPool.sqrtPrice === '0' && dataPool.tick === null) {
    dataPool.sqrtPrice = isFindToOsp ? initSqrtPriceX96FindToOsp : initSqrtPriceX96OspToFind
    dataPool.tick = isFindToOsp ? initTickFindToOsp : initTickOspToFind
  }
  
  return new Pool(
    tokenA, tokenB, FeeAmount.HIGH,
    JSBI.BigInt(dataPool.sqrtPrice),
    dataPool.liquidity,
    Number(dataPool.tick),
    ticks
  )
}

export function getPoolFindTVL(chainId: SupportedChainId, pool?: UniswapPool) {
  if (pool?.token0.id.toLowerCase() === FIND[currentChainId(chainId)]?.address.toLowerCase()) {
    return parseFloat(pool?.totalValueLockedToken0 || '0')
  }
  return parseFloat(pool?.totalValueLockedToken1 || '0')
}

export function getAmountPayMax(amountIn?: Fraction, slippage?: Percent) {
  return amountIn && new Fraction(JSBI.BigInt(1)).add(slippage ?? LOW_AUTO_SLIPPAGE).multiply(amountIn.quotient).quotient
}

export function getAmountPayMin(amountIn?: Fraction, slippage?: Percent) {
  return amountIn && new Fraction(JSBI.BigInt(1)).subtract(slippage ?? LOW_AUTO_SLIPPAGE).multiply(amountIn.quotient).quotient
}

export function getCurrencyAmount(token: Token, amount: string): CurrencyAmount<Token> {
  const raw = parseUnits(amount, token.decimals).toString()
  return CurrencyAmount.fromRawAmount(token, raw)
}

export function getCurrencyAmountMax(token: Token, amount: string, slippage?: Percent): CurrencyAmount<Token> {
  if (!slippage) return getCurrencyAmount(token, amount)
  const raw = parseUnits(amount, token.decimals).toString()
  const maxRaw = getAmountPayMax(new Fraction(raw), slippage)
  return CurrencyAmount.fromRawAmount(token, maxRaw?.toString() || '0')
}

export function getFractionFromUnit(unit: string) {
  const [, decimal] = unit.split('.')
  if (!decimal) return new Fraction(unit)
  return new Fraction(parseUnits(unit, decimal.length).toBigInt().toString(), "1".padEnd(decimal.length + 1, '0'))
}

export function getRepoName(tokenName?: string) {
  if (!tokenName) return ''
  const split = tokenName.split('/')
  return split[split.length - 1]
}

export function getOrgName(tokenName?: string) {
  if (!tokenName) return ''
  const split = tokenName.split('/')
  return split[split.length - 2]
}