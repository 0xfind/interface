import { useEffect, useMemo } from "react";

import { currentChainId } from "../constants/chains";
import useActiveWeb3React from "../hooks/useActiveWeb3React";
import useDebounce from "../hooks/useDebounce";
import { useAppDispatch } from "../state/hooks";
import { updateEthPrice, updateFindPrice, updateFindDerivedETH } from "../state/price/reducer";
import {FIND} from "../constants/token";
import { useUniswapClient } from "../hooks/useGraphqlClient";
import { useEthPriceQuery, useGetTokenQuery } from "../graphql/uniswap/generated";

export default function PriceUpdater(): null {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const uniswapClient = useUniswapClient()
  const { data: ethPriceData } = useEthPriceQuery({
    pollInterval: 15_000,
    client: uniswapClient,
  })
  const ethPrice = useMemo(() => {
    if (!ethPriceData?.bundles || ethPriceData.bundles.length === 0) return 0;
    return parseFloat(ethPriceData?.bundles[0].ethPriceUSD);
  }, [ethPriceData?.bundles])

  const { data: findToken } = useGetTokenQuery({
    variables: { id: FIND[currentChainId(chainId)].address.toLowerCase() },
    pollInterval: 15_000,
    client: uniswapClient,
  })

  const findPrice = useMemo(() => {
    if (!findToken?.token) return 0;
    return parseFloat(findToken.token.derivedETH) * ethPrice;
  }, [ethPrice, findToken?.token])

  const findDerivedETH = useMemo(() => {
    if (!findToken?.token?.derivedETH) return 0;
    return parseFloat(findToken.token.derivedETH);
  }, [findToken?.token?.derivedETH])

  const debouncedEthPrice = useDebounce(ethPrice, 100);
  const debouncedFindPrice = useDebounce(findPrice, 100);
  const debouncedFindDerivedETH = useDebounce(findDerivedETH, 100);

  useEffect(() => {
    if (debouncedEthPrice)
      dispatch(updateEthPrice({ ethPrice: debouncedEthPrice }));
    if (debouncedFindPrice)
      dispatch(updateFindPrice({ findPrice: debouncedFindPrice }));
    if (debouncedFindDerivedETH)
      dispatch(updateFindDerivedETH({ findDerivedETH: debouncedFindDerivedETH }));
  }, [debouncedEthPrice, debouncedFindDerivedETH, debouncedFindPrice, dispatch]);

  return null;
}
