import { useEffect, useMemo, useState } from "react";
import { Token as UniswapToken } from "@uniswap/sdk-core"
import { SupportedChainId } from "../constants/chains";
import { Token, useAllTokensQuery, useTokensByAddressesQuery } from "../graphql/find/generated";
import { Token as TokenUniswap, useEthPricesQuery, useGetTokensQuery } from "../graphql/uniswap/generated";
import { useCollectLPFee } from "./useCollectLPFee";
import { get2DayChange, getPercentChange, getDeltaTimestamps, getLogo, genLocalPool, getPoolFindTVL } from "../utils";
import { useBlockNumbers } from "./useBlockNumbers";
import { Pool } from "@uniswap/v3-sdk";
import { useFindClient, useUniswapClient } from "./useGraphqlClient";
import { useAppSelector } from "../state/hooks";
import { SupportedCurrency } from "../constants/currency";

export enum TokenClaimStatus {
  UNKNOWN = "UNKNOWN",
  CLAIMED = "CLAIMED",
  PENDING = "PENDING",
}

export type TokenData = {
  token: UniswapToken;

  id: string;
  logo: string;
  name: string;
  symbol: string;
  github: string;
  stars: number;

  // price
  priceUSD: number
  priceUSDChange: number
  priceUSDChangeWeek: number
  priceChange: number

  // nft
  // createNFTIncomeUSD: number;
  createNFTIncomeFind: number;
  createNFTCollectedFind: number;
  ownerNFTIncomeUSD: number
  ownerNFTIncomeOSP: number
  ownerNFTCollectedOSP: number;
  claimStatus: TokenClaimStatus;
  ownerNFTId: string;
  ownerNFTOwner: string;
  createNFTId: string;
  createNFTOwner: string;

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number
  txCount: number

  // tvl
  tvlUSD: number;
  tvlUSDChange: number;
  tvlToken: number;
  tvlFind: number;
  tvlFindChange: number;

  //fees
  feesUSD: number

  poolAddress: string;
  pool?: Pool
};

export type TokenResult = {
  isLoading: boolean;
  isError: boolean;
  data: TokenData[];
  searchedData: TokenData[];
  totalUSDValue: number;
  totalFindLocked: number;
}

export type TokenDetailResult = {
  isLoading: boolean;
  isError: boolean;
  datum?: TokenData;
}

export function useDetailToken(address: string, chainId: SupportedChainId, pollInterval?: number): TokenDetailResult {
  const findClient = useFindClient()
  const { data, loading, error } = useTokensByAddressesQuery({
    variables: { addresses: [address] },
    pollInterval,
    client: findClient
  });
  const result = useTokens(data?.tokens as any || [], loading, chainId, "", { withLPFee: true })
  return useMemo(() => ({
    isLoading: loading || result.isLoading,
    isError: !!error || result.isError,
    datum: result.data.length === 1 ? result.data[0] : undefined,
  }), [error, loading, result.data, result.isError, result.isLoading]);
}

export function useAllTokens(searchKeyword: string, chainId: SupportedChainId, pollInterval?: number): TokenResult {
  const { data, loading, error } = useAllTokensQuery(
    {
      pollInterval,
      client: useFindClient()
    },
  );
  const result = useTokens(data?.tokens as any || [], loading, chainId, searchKeyword, { withLPFee: true })
  return useMemo(() => ({
    isLoading: loading || result.isLoading,
    isError: !!error || result.isError,
    data: result.data,
    searchedData: result.searchedData,
    totalUSDValue: result.totalUSDValue,
    totalFindLocked: result.totalFindLocked,
  }), [error, loading, result])
}

export function useAllMortgageTokens(chainId: SupportedChainId) {
  const { data, loading, error } = useAllTokensQuery({
    client: useFindClient()
  })

  const result = useTokens(data?.tokens as any || [], loading, chainId, "", { withLPFee: false })

  return useMemo(() => ({
    isLoading: loading || result.isLoading,
    isError: error || result.isError,
    data: result.data,
    searchedData: result.searchedData,
    totalUSDValue: result.totalUSDValue,
  }), [error, loading, result])
}

export type TokenOptions = {
  withLPFee?: boolean;
}

function parsedTokenData(tokens: any) {
  return tokens.reduce((accum: { [address: string]: TokenUniswap }, tokenData: any) => {
    accum[tokenData.id] = tokenData
    return accum
  }, {})
}

export function useTokens(tokens: Token[], tokenLoading: boolean, chainId: SupportedChainId, searchKeyword: string, options: TokenOptions): TokenResult {
  const { withLPFee } = useMemo(() => options, [options])
  const tokenAddresses = useMemo(() => tokens.map((t) => (t.id.toLowerCase())), [tokens])

  const [t24, t48, tWeek] = getDeltaTimestamps()

  const { isLoading: blockNumberLoading, blocks } = useBlockNumbers([t24, t48, tWeek])
  const [block24, block48, blockWeek] = useMemo(() => blocks || [], [blocks])

  const uniswapClient = useUniswapClient()

  const { loading: getTokensLoading, error: getTokensError, data } = useGetTokensQuery({
    variables: {
      ids: tokenAddresses,
      block24: parseInt(block24 || '0'),
      block48: parseInt(block48 || '0'),
      blockWeek: parseInt(blockWeek || '0'),
    },
    skip: tokenLoading && tokenAddresses.length === 0 && blockNumberLoading && !block24,
    client: uniswapClient
  })

  const {
    collectLPFee,
    isLoading: lpFeeLoading,
    isError: lpFeeError
  } = useCollectLPFee(
    useMemo(() => withLPFee ? tokenAddresses : [], [tokenAddresses, withLPFee])
  )

  const [parsed, setParsed] = useState<Record<string, TokenUniswap>>({})
  const [parsed24, setParsed24] = useState<Record<string, TokenUniswap>>({})
  const [parsed48, setParsed48] = useState<Record<string, TokenUniswap>>({})
  const [parsedWeek, setParsedWeek] = useState<Record<string, TokenUniswap>>({})

  useEffect(() => {
    if (data?.tokens) setParsed(parsedTokenData(data.tokens))
    if (data?.token24) setParsed24(parsedTokenData(data.token24))
    if (data?.token48) setParsed48(parsedTokenData(data.token48))
    if (data?.tokenWeek) setParsedWeek(parsedTokenData(data.tokenWeek))
  }, [data?.token24, data?.token48, data?.tokenWeek, data?.tokens])

  const { data: ethPrices, loading: ethPricesLoading, error: ethPricesError } = useEthPricesQuery({
    variables: {
      block24: parseInt(block24 || '0'),
      block48: parseInt(block48 || '0'),
      blockWeek: parseInt(blockWeek || '0'),
    },
    skip: blockNumberLoading && !block24,
    client: uniswapClient
  })

  const [ethCurrentPrice, setEthCurrentPrice] = useState(0)
  const [ethOneDayPrice, setEthOneDayPrice] = useState(0)
  const [ethWeekPrice, setEthWeekPrice] = useState(0)

  useEffect(() => {
    if (ethPrices?.current && ethPrices.current.length > 0 && parseFloat(ethPrices.current[0].ethPriceUSD) > 0) setEthCurrentPrice(parseFloat(ethPrices.current[0].ethPriceUSD))
    if (ethPrices?.oneDay && ethPrices.oneDay.length > 0 && parseFloat(ethPrices.oneDay[0].ethPriceUSD) > 0) setEthOneDayPrice(parseFloat(ethPrices.oneDay[0].ethPriceUSD))
    if (ethPrices?.oneWeek && ethPrices.oneWeek.length > 0 && parseFloat(ethPrices.oneWeek[0].ethPriceUSD) > 0) setEthWeekPrice(parseFloat(ethPrices.oneWeek[0].ethPriceUSD))
  }, [ethPrices])

  const isLoading: boolean = useMemo(() => blockNumberLoading || getTokensLoading || lpFeeLoading || ethPricesLoading, [blockNumberLoading, ethPricesLoading, getTokensLoading, lpFeeLoading])
  const isError: boolean = useMemo(() => !!getTokensError || lpFeeError || !!ethPricesError, [ethPricesError, getTokensError, lpFeeError])

  const currentCurrency = useAppSelector((state) => state.user.currentCurrency || SupportedCurrency.USD)

  const formatted: { [address: string]: TokenData } = useMemo(() => tokens.reduce((accum: { [address: string]: TokenData }, token: Token) => {
    const address = token.id.toLowerCase()
    const current: TokenUniswap | undefined = parsed[address]
    const oneDay: TokenUniswap | undefined = parsed24[address]
    const twoDay: TokenUniswap | undefined = parsed48[address]
    const week: TokenUniswap | undefined = parsedWeek[address]

    const [volumeUSD, volumeUSDChange] =
      current && oneDay && twoDay
        ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
          ? [parseFloat(current.volumeUSD), 0]
          : [0, 0]

    const volumeUSDWeek =
      current && week
        ? parseFloat(current.volumeUSD) - parseFloat(week.volumeUSD)
        : current
          ? parseFloat(current.volumeUSD)
          : 0
    const tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0
    const tvlUSDChange = getPercentChange(current?.totalValueLockedUSD, oneDay?.totalValueLockedUSD)
    const tvlToken = current ? parseFloat(current.totalValueLocked) : 0
    const priceUSD = current ? parseFloat(current.derivedETH) * ethCurrentPrice : 0
    // console.log({ priceUSD, current, ethCurrentPrice });

    const priceUSDOneDay = oneDay ? parseFloat(oneDay.derivedETH) * ethOneDayPrice : 0
    const priceUSDWeek = week ? parseFloat(week.derivedETH) * ethWeekPrice : 0
    const priceUSDChange =
      priceUSD && priceUSDOneDay ? getPercentChange(priceUSD.toString(), priceUSDOneDay.toString()) : 0

    let priceChange = 0

    if (currentCurrency === SupportedCurrency.USD) {
      priceChange = priceUSD && priceUSDOneDay ? getPercentChange(priceUSD.toString(), priceUSDOneDay.toString()) : 0
    }
    if (currentCurrency === SupportedCurrency.ETH || currentCurrency === SupportedCurrency.FIND) {
      priceChange = current && oneDay ? getPercentChange(current.derivedETH, oneDay.derivedETH) : 0
    }

    const priceUSDChangeWeek =
      priceUSD && priceUSDWeek ? getPercentChange(priceUSD.toString(), priceUSDWeek.toString()) : 0
    const txCount =
      current && oneDay
        ? parseFloat(current.txCount) - parseFloat(oneDay.txCount)
        : current
          ? parseFloat(current.txCount)
          : 0
    const feesUSD =
      current && oneDay
        ? parseFloat(current.feesUSD) - parseFloat(oneDay.feesUSD)
        : current
          ? parseFloat(current.feesUSD)
          : 0

    const claimStatus = token.IsClaimed ? TokenClaimStatus.CLAIMED : TokenClaimStatus.UNKNOWN;
    const lpFee = collectLPFee[address]
    // const createNFTIncomeUSD = (lpFee?.createNFTFee || 0) * findPrice
    const createNFTIncomeFind = lpFee?.createNFTFee || 0
    const ownerNFTIncomeUSD = (lpFee?.ownerNFTFee || 0) * priceUSD
    const ownerNFTIncomeOSP = lpFee?.ownerNFTFee || 0

    const poolAddress = token.pool.id.toLowerCase()
    const currentPool = current?.whitelistPools?.find((pool) => pool.id.toLowerCase() === poolAddress)
    const tvlFind = getPoolFindTVL(chainId, currentPool)
    const oneDayPool = oneDay?.whitelistPools?.find((pool) => pool.id.toLowerCase() === poolAddress)
    const tvlFindChange = getPercentChange(getPoolFindTVL(chainId, currentPool).toString(), getPoolFindTVL(chainId, oneDayPool).toString())

    accum[address] = {
      token: new UniswapToken(
        chainId,
        token.id,
        18,
        token.symbol,
        token.name
      ),

      id: address,
      logo: getLogo(token.projectId),
      name: token.symbol,
      symbol: token.symbol,
      github: `https://${token.name}`,
      stars: parseInt(token.stars),

      priceUSD,
      priceUSDChange,
      priceUSDChangeWeek,
      priceChange,

      createNFTIncomeFind,
      createNFTCollectedFind: token.cnft?.collectedIncomeTokenAmount,
      ownerNFTIncomeUSD,
      ownerNFTIncomeOSP,
      ownerNFTCollectedOSP: token.onft?.collectedIncomeTokenAmount,
      claimStatus,
      ownerNFTId: token.onft?.id || "0x0",
      ownerNFTOwner: token.onft?.owner || "",
      createNFTId: token.cnft?.id || "0x0",
      createNFTOwner: token.cnft?.owner || "",

      volumeUSD,
      volumeUSDChange,
      volumeUSDWeek,
      txCount,

      feesUSD,
      tvlUSD,
      tvlUSDChange,
      tvlToken,
      tvlFind,
      tvlFindChange,

      poolAddress,
      pool: genLocalPool(chainId, currentPool)
    }
    return accum
  }, {}), [tokens, parsed, parsed24, parsed48, parsedWeek, ethCurrentPrice, ethOneDayPrice, ethWeekPrice, currentCurrency, collectLPFee, chainId])

  const [formattedData, setFormattedData] = useState<TokenData[]>([])

  useEffect(() => {
    const d = Object.values(formatted)
    if (d.length > 0) setFormattedData(d)
  }, [formatted])

  const totalUSDValue: number = useMemo(() => (formattedData.reduce((acc: number, p: TokenData) => acc + p.priceUSD * 2_100_000, 0)), [formattedData])
  const totalFindLocked: number = useMemo(() => (formattedData.reduce((acc: number, p: TokenData) => acc + p.tvlFind, 0)), [formattedData])

  const searchedData: TokenData[] = useMemo(() => {
    if (searchKeyword !== "") {
      return formattedData.filter((d) => d.name.toLowerCase().includes(searchKeyword.toLowerCase())).sort((a, b) => b.stars - a.stars)
    }
    return []
  }, [formattedData, searchKeyword])

  return useMemo(() => ({
    isError,
    isLoading,
    data: formattedData,
    totalUSDValue,
    searchedData,
    totalFindLocked,
  }), [formattedData, isError, isLoading, searchedData, totalFindLocked, totalUSDValue])
}