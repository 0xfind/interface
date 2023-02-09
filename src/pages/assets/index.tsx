import { t, Trans } from "@lingui/macro";
import { Avatar, Box, Button, Divider, Menu, Stack } from "@mui/material";
import { CurrencyAmount, Fraction, Token } from "@uniswap/sdk-core";
import { useState, useMemo, useEffect, useCallback } from "react";
import SwipeableViews from 'react-swipeable-views';
import { useSnackbar } from 'notistack'
import { MortgageCard } from "../../components/Card";
import { MortgageTable, Position } from "../../components/Table/Mortgage";
import { formatNumber, formatX18, getCurrencyAmount, getCurrencyAmountMax } from "../../utils";
import SelectButton from "../../components/Button/Select";
import AssetInput from "../../components/Input/Asset";
import SelectTokenDialog, { Asset } from "../../components/Dialog/SelectToken";
import { History, MortgageHistoryDialog } from "../../components/Dialog/History";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { TokenData, useAllMortgageTokens } from "../../hooks/useTokens";
import { currentChainId, SupportedChainId } from "../../constants/chains";
import { useTokenBalances } from "../../hooks/useCurrencyBalance";
import { FIND, getSelectToken, getSelectTokenByAddress, nativeOnChain, SelectToken, SelectTokenSlippage, WETH } from "../../constants/token";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { setWalletOpenModal } from "../../state/application/reducer";
import { ApprovalState, useApprovalStateForSpender } from "../../hooks/useApproval";
import { useFindMortgageContract } from "../../hooks/useContract";
import ApproveButton from "../../components/Button/Approve";
import { parseUnits } from "ethers/lib/utils";
import { LoadingButton } from "@mui/lab";
import { getScanLink, getSwapLink } from "../../constants/link";
import { OperationHistory } from "../../graphql/find/generated";
import { AddressCopyText, EmptyRow, TooltipBox } from "../../components/Box/Common";
import { MortgagePosition, useMortgage } from "../../hooks/useMortgage";
import { useSearchParams } from "react-router-dom";
import { Pool } from "@uniswap/v3-sdk";
import { PulseLoader } from "react-spinners" 
import JSBI from "jsbi";
import { FINDCoinIcon, VerticalSettingIcon } from "../../components/Icons";
import { CommonTooltip } from "../../components/Tooltip/Common";
import { CustomMenuItem } from "../../components/Menu";
import useCopyToClipboard from "../../hooks/useCopyToClipboard";
import { PairTokenSelect } from "../../components/Select/Common";
import useSetState from "../../hooks/useSetState";
import { BigNumber, ContractReceipt } from "ethers";
import CurrencyText from "../../components/Box/Currency";
import { SupportedCurrency } from "../../constants/currency";
import usePriceConv from "../../hooks/usePriceConv";
import { useOperationHistoriesByUserLazyQuery } from "../../graphql/find/generated";
import { useFindClient } from "../../hooks/useGraphqlClient";
import { getPathToFind } from "../../utils/path";
import { mortgagedInOsp } from "../../utils/mortgage";

enum InputType {
  In = 'in',
  Out = 'out'
}

interface MortgageForm {
  token?: TokenData,
  positionId?: number,
  outToken: Token,
  outAmount?: string,
  amount?: string,
  input?: InputType,
}

interface MultiplyForm {
  amount?: string,
  token: Token,

  outAsset?: TokenData,
  outAmount?: string,
  outPositionId?: number,

  multiplyAmount?: string,
  multiplyFindAmount?: Fraction,
  feeAmount?: string,
  
  input?: InputType,
}

type contractReturn = {
  msg: string;
  link?: string;
  color?: string;
  isError: boolean;
};

enum CurrentTab {
  mortgage = 'mortgage',
  cash = 'cash',
  redeem = 'redeem',
  multiply = 'multiply',
}

const historyTextRender = (
  type: 'mortgage' | 'redeem' | 'multiply' | 'cash',
  amountIn: string, tokenIn: string, amountOut: string, tokenOut: string
) => {
  switch (type) {
    case 'mortgage':
      return `${t`Mortgage`}: ${amountIn} ${tokenIn} ${t`get`} ${amountOut} ${tokenOut}`
    case 'redeem':
      return `${t`Redeem`}: ${amountIn} ${tokenIn} ${t`get`} ${amountOut} ${tokenOut}`
    case 'multiply':
      return `${t`Multiply`}: ${amountIn} ${tokenIn} ${t`get`} ${amountOut} ${tokenOut}`
    case 'cash':
      return `${t`Cash`}: ${amountIn} ${tokenIn} ${t`get`} ${amountOut} ${tokenOut}`
  }
}

const getHistoryText = (chainId: SupportedChainId, tokensObject: Record<string, TokenData>, raw: OperationHistory) => {
  if (raw.type === "mortgage") {
    const token = tokensObject[raw.mortgage?.ospAsset || '']
    const out = getSelectTokenByAddress(chainId, raw.mortgage?.tokenOut || '') || ''
    return historyTextRender('mortgage', formatX18(raw.mortgage?.inOspAmount), token?.symbol || '', formatX18(raw.mortgage?.amountOut), out)
  }
  if (raw.type === "redeem") {
    const token = tokensObject[raw.redeem?.ospAsset || ''];
    const out = getSelectTokenByAddress(chainId, raw.redeem?.tokenIn || '') || ''
    return historyTextRender('redeem', formatX18(raw.redeem?.amountIn), out, formatX18(raw.redeem?.outOspAmount), token?.symbol || '')
  }
  if (raw.type === "multiply") {
    const token = tokensObject[raw.multiply?.ospAsset || ''];
    const out = getSelectTokenByAddress(chainId, raw.multiply?.tokenPay || '') || ''
    return historyTextRender('multiply', formatX18(raw.multiply?.amountNeedPay), out, formatX18(raw.multiply?.ospAmount), token?.symbol || '')
  }
  if (raw.type === "cash") {
    const token = tokensObject[raw.cash?.ospAsset || ''];
    const out = getSelectTokenByAddress(chainId, raw.cash?.tokenOut || '') || ''
    return historyTextRender('cash', formatX18(raw.cash?.outOspPositionAmount), token?.symbol || '', formatX18(raw.cash?.amountOut), out)
  }
  return ``
}

const injectEarning = async (pool: Pool, token: Token, pos: MortgagePosition) => {
  const [outFind] = await pool.getOutputAmount(CurrencyAmount.fromRawAmount(token, pos.ospAmount))
  const [debt, debtFee] = await mortgagedInOsp(pos.ospAmount, JSBI.BigInt(0))
  const findDebt = debt.add(debtFee).asFraction.quotient
  const posValue = outFind.asFraction.quotient
  const earning = JSBI.subtract(posValue, findDebt)
  return {
    ...pos,
    address: token.address.toLowerCase(),
    debt: findDebt,
    //ignore 1wei
    earning: JSBI.lessThanOrEqual(earning, JSBI.BigInt(1)) ? undefined : earning
  }
}

const Assets = () => {
  const { account } = useActiveWeb3React()
  const { enqueueSnackbar } = useSnackbar()
  const chainId = useAppSelector(state => currentChainId(state.application.chainId));

  const { data } = useAllMortgageTokens(chainId);

  const tokens = useMemo(() => {
    if (!account) return [];
    return [FIND[chainId], ...(data.map(token => token.token) || [])];
  }, [account, chainId, data])

  const balancesMap = useTokenBalances(account || undefined, [...tokens, WETH[chainId]])

  const findPrice = useAppSelector((state) => state.price.findPrice)

  const tokensObject = useMemo(() => {
    const tokensObject = data.reduce((acc: { [address: string]: TokenData }, token) => {
      acc[token.id.toLowerCase()] = token
      return acc
    }, {});
    const findAddr = FIND[chainId].address.toLowerCase()
    tokensObject[findAddr] = {
      symbol: "FIND",
      name: "FIND",
      github: "github.com/0xfind/0xfind",
      priceUSD: findPrice,
      id: findAddr
    } as TokenData
    return tokensObject
  }, [chainId, data, findPrice])

  const [nzAssets, assets, totalAssetsUSD] = useMemo(() => {
    let totalAssetsUSD = 0
    let assets: Asset[] = tokens.map((t) => {
      const b = balancesMap[t.address]
      const token = tokensObject[t.address.toLowerCase() || '']
      const priceUSD = token.priceUSD || 0
      const amount = parseFloat(b?.toFixed(3) || '0')
      const valueUSD = priceUSD * parseFloat(b?.toFixed(3) || '0')
      totalAssetsUSD += valueUSD
      // console.log([token?.symbol, token?.id, priceUSD, amount, valueUSD])
      return {
        token,
        logo: token.logo,
        valueUSD,
        priceUSD,
        amount
      }
    })
    // console.log({ totalAssetsUSD })
    assets = assets.sort(
      (firstItem, secondItem) => {
        if (firstItem.token.id === FIND[chainId].address.toLowerCase()) return -1
        if (secondItem.token.id === FIND[chainId].address.toLowerCase()) return 1
        return secondItem.valueUSD - firstItem.valueUSD 
      }
    )
    
    return [assets.filter((a) => a.amount > 0 || a.token.id === FIND[chainId].address.toLowerCase()), assets, totalAssetsUSD]
  }, [balancesMap, chainId, tokens, tokensObject])
  const [search, setSearchParams] = useSearchParams()

  const [currentTab, setCurrentTab] = useState<CurrentTab>(CurrentTab.mortgage)
  const [mortgageForm, updateMortgageForm, setMortgageForm] = useSetState<MortgageForm>({ outToken: WETH[chainId] })
  const [cashForm, updateCashForm, setCashForm] = useSetState<MortgageForm>({ outToken: WETH[chainId] })
  const [redeemForm, updateRedeemForm, setRedeemForm] = useSetState<MortgageForm>({ outToken: WETH[chainId] })
  const [multiplyForm, updateMultiplyForm, setMultiplyForm] = useSetState<MultiplyForm>({ token: WETH[chainId] })

  const clearForm = useCallback(() => {
    setMortgageForm({ outToken: WETH[chainId] })
    setCashForm({ outToken: WETH[chainId] })
    setRedeemForm({ outToken: WETH[chainId] })
    setMultiplyForm({ token: WETH[chainId] })
  }, [chainId, setCashForm, setMortgageForm, setMultiplyForm, setRedeemForm])

  useEffect(() => {
    // set default form data
    clearForm()
  }, [clearForm])

  const [selectTokenDialog, setSelectTokenDialog] = useState<boolean>(false)
  const [historyDialog, setHistoryDialog] = useState<boolean>(false)
  const [historyData, setHistoryData] = useState<History[]>([])

  const findClient = useFindClient()

  const [targetOperationHistories, { loading: loadingOperationHistories }] = useOperationHistoriesByUserLazyQuery({ client: findClient })

  const handleClickHistory = useCallback(() => {
    if (!account) return
    targetOperationHistories({
      variables: { user: account },
    }).then((ret) => {
      // console.log(ret.operationHistories)
      const historiesData = ret.data?.operationHistories.map((his) => {
        return {
          text: getHistoryText(chainId, tokensObject, his as any),
          link: getScanLink(chainId, his.id),
          timestamps: his.timestamp,
        }
      })
      if (historiesData) {
        setHistoryData(historiesData)
        setHistoryDialog(true)
      }
    })
  }, [account, chainId, targetOperationHistories, tokensObject])

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!account) dispatch(setWalletOpenModal(true))
    if (account) dispatch(setWalletOpenModal(false))
  }, [account, dispatch])

  const {
    positions,
    // getOspMortgaged,
    targetMortgageInOsp,
    targetMortgageOutFind,
    targetCashInOsp,
    targetCashOutEarn,
    targetRedeemInOsp,
    targetRedeemOutFind,
    targetMultiplyInFind,
    // targetMultiplyOutOsp,
    positionLoading,
    mortgageInOspLoading,
    mortgageOutFindLoading,
    multiplyInFindLoading,
    // multiplyOutOspLoading
  } = useMortgage(chainId)

  const getPositionIdByOsp = useCallback((ospToken: string) => {
    return positions.find(p => p.ospAsset === ospToken)?.positionId
  }, [positions])

  const [mortgagePositions, setMortgagePositions] = useState<Position[]>([])
  const [mortgagePositionsLoading, setMortgagePositionsLoading] = useState<boolean>(true)
  const [mortgagePositionsTotalEarning, setMortgagePositionsTotalEarning] = useState<CurrencyAmount<Token>>()

  // TODO: use this to refresh position when user change account
  // useEffect(() => {
  //   setMortgagePositions([])
  //   setMortgagePositionsLoading(true)
  //   setMortgagePositionsTotalEarning(undefined)
  // }, [account, chainId])

  useEffect(() => {
    if (positionLoading) {
      setMortgagePositionsLoading(true)
      return
    }
    if (positions.length === 0) {
      setMortgagePositionsLoading(false)
      setMortgagePositions([])
      return
    }
    const calcEarningFunc = []
    const posEarning: Record<number, Position> = {}
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i]
      const t = data.find((d) => d.id.toLowerCase() === pos.ospAsset)
      if (!t) continue
      posEarning[pos.positionId] = {
        positionId: pos.positionId,
        collLocked: CurrencyAmount.fromRawAmount(t.token, pos.ospAmount),
        token: t
      }
      const pool = t?.pool
      if (pool) {
        calcEarningFunc.push(injectEarning(pool, t.token, pos))
      }
    }
    if (calcEarningFunc.length > 0) Promise.all(calcEarningFunc).then((ret) => {
      let totalEarning = CurrencyAmount.fromRawAmount(FIND[chainId], JSBI.BigInt(0))
      ret.forEach((r) => {
        if (posEarning[r.positionId]) {
          const findEarning = CurrencyAmount.fromRawAmount(FIND[chainId], r.earning || 0)
          const findDebt = CurrencyAmount.fromRawAmount(FIND[chainId], r.debt || 0)
          posEarning[r.positionId].findEarning = findEarning
          posEarning[r.positionId].findDebt = findDebt
          if (r.earning) totalEarning = totalEarning.add(findEarning)
        }
      })
      setMortgagePositions(Object.values(posEarning).reverse())
      setMortgagePositionsTotalEarning(totalEarning)
      setMortgagePositionsLoading(false)
    })
    else {
      setMortgagePositions(Object.values(posEarning).reverse())
      setMortgagePositionsTotalEarning(undefined)
      setMortgagePositionsLoading(false)
    }
  }, [chainId, data, positionLoading, positions])

  const findDerivedETH = useAppSelector((state) => state.price.findDerivedETH)

  const { convAToFind, convFindToA } = usePriceConv(findDerivedETH === 0 ? undefined : new Fraction(1e19, findDerivedETH * 1e19))

  const updateMortgageFindAmount = useCallback((a: CurrencyAmount<Token>, t?: Token) => {
    updateMortgageForm({ outAmount: convFindToA(t || mortgageForm.outToken, a).toSignificant(6) })
  }, [convFindToA, mortgageForm.outToken, updateMortgageForm])

  const updateMortgageValue = useCallback((amount?: string, outToken?: Token, token?: TokenData, positionId?: number) => {
    outToken = outToken || mortgageForm.outToken
    token = token || mortgageForm.token
    positionId = positionId || mortgageForm.positionId
    updateMortgageForm({ amount, input: InputType.In, outToken, token, positionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateMortgageForm({ outAmount: undefined })
      return
    }
    if (token) {
      targetMortgageInOsp(getCurrencyAmount(token.token, amount), positionId, (v: any) => updateMortgageFindAmount(v, outToken), setMortgageFeeFindAmount)
    }
  }, [mortgageForm.outToken, mortgageForm.positionId, mortgageForm.token, targetMortgageInOsp, updateMortgageFindAmount, updateMortgageForm])

  const updateCashOutAmount = useCallback((a: CurrencyAmount<Token>, t?: Token) => {
    updateCashForm({ outAmount: convFindToA(t || cashForm.outToken, a).toSignificant(6) })
  }, [cashForm.outToken, convFindToA, updateCashForm])

  const updateCashValue = useCallback((amount?: string, outToken?: Token, token?: TokenData, positionId?: number) => {
    outToken = outToken || cashForm.outToken
    token = token || cashForm.token
    positionId = positionId || cashForm.positionId
    updateCashForm({ amount, input: InputType.In, outToken, token, positionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateCashForm({ outAmount: undefined })
      return
    }
    if (token) {
      const cashAmount = getCurrencyAmount(token.token, amount)
      token.pool?.getOutputAmount(cashAmount).then(([marketAmount]) => {
        targetCashInOsp(cashAmount, marketAmount.asFraction, positionId, (v: any) => updateCashOutAmount(v, outToken))
      })
    }
  }, [cashForm.outToken, cashForm.positionId, cashForm.token, targetCashInOsp, updateCashForm, updateCashOutAmount])

  const updateRedeemOutAmount = useCallback((a: CurrencyAmount<Token>, t?: Token) => {
    updateRedeemForm({ outAmount: convFindToA(t || redeemForm.outToken, a).toSignificant(6) })
  }, [convFindToA, redeemForm.outToken, updateRedeemForm])

  const updateRedeemValue = useCallback((amount?: string, outToken?: Token, token?: TokenData, positionId?: number) => {
    outToken = outToken || redeemForm.outToken
    token = token || redeemForm.token
    positionId = positionId || redeemForm.positionId
    updateRedeemForm({ amount, input: InputType.In, outToken, token, positionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateRedeemForm({ outAmount: undefined })
      return
    }
    if (token) {
      targetRedeemInOsp(getCurrencyAmount(token.token, amount), positionId, (v: any) => updateRedeemOutAmount(v, outToken))
    }
  }, [redeemForm.outToken, redeemForm.positionId, redeemForm.token, targetRedeemInOsp, updateRedeemForm, updateRedeemOutAmount])

  const updateMultiplyOutAmount = useCallback((f: CurrencyAmount<Token>, o: CurrencyAmount<Token>, fee: CurrencyAmount<Token>, t?: Token) => {
    const multiplyAmount = convFindToA(t || multiplyForm.token, f)
    const feeAmount = convFindToA(t || multiplyForm.token, fee)
    updateMultiplyForm({ outAmount: o.toSignificant(6), multiplyAmount: multiplyAmount.toSignificant(6), feeAmount: feeAmount.toSignificant(6), multiplyFindAmount: f })
  }, [convFindToA, multiplyForm.token, updateMultiplyForm])

  const updateMultiplyValue = useCallback((amount?: string, token?: Token, outAsset?: TokenData, outPositionId?: number) => {
    token = token || multiplyForm.token
    outAsset = outAsset || multiplyForm.outAsset
    outPositionId = outPositionId || multiplyForm.outPositionId
    updateMultiplyForm({ amount, input: InputType.In, token, outAsset, outPositionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateMultiplyForm({ outAmount: undefined, multiplyAmount: undefined })
      return
    }
    if (outAsset) {
      const findAmount = convAToFind(token, getCurrencyAmount(token, amount))
      targetMultiplyInFind(outPositionId, outAsset, findAmount, (f: any, o: any, fee: any) => updateMultiplyOutAmount(f, o, fee, token))
    }
  }, [convAToFind, multiplyForm.outAsset, multiplyForm.outPositionId, multiplyForm.token, targetMultiplyInFind, updateMultiplyForm, updateMultiplyOutAmount])

  const mortgageFooter = useMemo(() => {
    if (!mortgageForm.token || !mortgageForm.token.token || !account) return undefined
    return <Stack direction={"row"} spacing="25px" sx={{
      alignItems: "center", justifyContent: "space-between",
      cursor: "pointer"
    }}>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext", height: "18.88px"
      }}>
        <Trans>Balance:</Trans>   {balancesMap[mortgageForm?.token?.token?.address || '']?.toSignificant(4)}
      </Box>
      <Box>
        <Button onClick={() => {
          updateMortgageValue(balancesMap[mortgageForm?.token?.token?.address || '']?.toExact())
        }} disableElevation sx={{
          p: "3px 2px",
          bgcolor: "#FDEAF1",
          color: "inuse.error",
          fontWeight: 500, fontSize: "9px", lineHeight: "11px",
          height: "17px",
          textTransform: "capitalize",
          "&:hover": {
            bgcolor: "#FDEAF1",
          }
        }} >
          <Trans>Maximum</Trans>
        </Button>
      </Box>
    </Stack>
  }, [account, balancesMap, mortgageForm.token, updateMortgageValue])

  const cashFooter = useMemo(() => {
    if (!account || !cashForm.positionId) return undefined
    const searched = mortgagePositions.find((p) => p.positionId === cashForm.positionId)
    return <Stack direction={"row"} spacing="25px" sx={{
      alignItems: "center", justifyContent: "space-between",
      cursor: "pointer"
    }}>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext", height: "18.88px"
      }}>
        <Trans>Locked:</Trans>   {searched?.collLocked?.toSignificant(6) || '0'}
      </Box>
      <Box>
        <Button onClick={() => {
          updateCashValue(searched?.collLocked?.toExact())
        }} disableElevation sx={{
          p: "3px 2px",
          bgcolor: "#FDEAF1",
          color: "inuse.error",
          fontWeight: 500, fontSize: "9px", lineHeight: "11px",
          height: "17px",
          textTransform: "capitalize",
          "&:hover": {
            bgcolor: "#FDEAF1",
          }
        }} disabled={!searched}>
          <Trans>Maximum</Trans>
        </Button>
      </Box>
    </Stack>
  }, [account, cashForm.positionId, mortgagePositions, updateCashValue])

  const redeemOutFooter = useMemo(() => {
    if (!account) return undefined
    return <Stack direction={"row"} spacing="25px" sx={{
      alignItems: "center", justifyContent: "space-between",
      cursor: "pointer"
    }}>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext", height: "18.88px"
      }}>
        <Trans>Balance:</Trans>   {balancesMap[redeemForm.outToken.address]?.toSignificant(4) || '0'}
      </Box>
    </Stack>
  }, [account, balancesMap, redeemForm.outToken])

  const multiplyInFooter = useMemo(() => {
    if (!account) return undefined
    return <Stack direction={"row"} spacing="25px" sx={{
      alignItems: "center", justifyContent: "space-between",
      cursor: "pointer"
    }}>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext", height: "18.88px"
      }}>
        <Trans>Balance:</Trans>   {balancesMap[multiplyForm.token.address]?.toSignificant(6)}
      </Box>
      <Box>
        <Button onClick={() => {
          updateMultiplyValue(balancesMap[multiplyForm.token.address]?.toExact())
        }} disableElevation sx={{
          p: "3px 2px",
          bgcolor: "#FDEAF1",
          color: "inuse.error",
          fontWeight: 500, fontSize: "9px", lineHeight: "11px",
          height: "17px",
          textTransform: "capitalize",
          "&:hover": {
            bgcolor: "#FDEAF1",
          }
        }} >
          <Trans>Maximum</Trans>
        </Button>
      </Box>
    </Stack>
  }, [account, balancesMap, multiplyForm.token, updateMultiplyValue])

  const handleClickTokenDialog = useCallback((assetIndex: number) => {
    const asset = assets[assetIndex]
    if (!asset) return
    search.set('token', asset.token.token.address.toLowerCase())
    setSearchParams(search)
    setSelectTokenDialog(false)
  }, [assets, search, setSearchParams])

  const handleClickMenu = useCallback((tokenId?: string, action?: CurrentTab, positionId?: number) => {
    if (action) search.set('action', action)
    if (tokenId) search.set('token', tokenId.toLowerCase())
    // if (positionId) search.set('position', positionId.toString())
    setSearchParams(search)
    clearForm()
  }, [clearForm, search, setSearchParams])

  const contract = useFindMortgageContract(true)

  const mortgageOSPAmount = useMemo(() => {
    if (!mortgageForm.token || !mortgageForm.token.token || !mortgageForm.amount) return
    return getCurrencyAmount(mortgageForm.token.token, mortgageForm.amount)
  }, [mortgageForm.amount, mortgageForm.token])

  const cashOSPAmount = useMemo(() => {
    if (!cashForm.token || !cashForm.token.token || !cashForm.amount) return
    return getCurrencyAmount(cashForm.token.token, cashForm.amount)
  }, [cashForm.amount, cashForm.token])

  const redeemOutAmount = useMemo(() => {
    if (!redeemForm.token || !redeemForm.token.token || !redeemForm.outAmount) return
    // add slippage
    const sid = getSelectTokenByAddress(chainId, redeemForm.outToken.address)
    return getCurrencyAmountMax(redeemForm.outToken, redeemForm.outAmount, SelectTokenSlippage[sid])
  }, [chainId, redeemForm.outAmount, redeemForm.outToken, redeemForm.token])

  const multiplyInAmount = useMemo(() => {
    if (!multiplyForm.outAsset || !multiplyForm.outAsset.token || !multiplyForm.amount) return
    // add slippage
    const sid = getSelectTokenByAddress(chainId, multiplyForm.token.address)
    return getCurrencyAmountMax(multiplyForm.token, multiplyForm.amount, SelectTokenSlippage[sid])
  }, [chainId, multiplyForm.amount, multiplyForm.outAsset, multiplyForm.token])

  const mortgageApproval = useApprovalStateForSpender(
    mortgageOSPAmount,
    contract?.address ?? undefined
  )

  const redeemApproval = useApprovalStateForSpender(
    redeemOutAmount,
    contract?.address ?? undefined
  )

  const multiplyApproval = useApprovalStateForSpender(
    multiplyInAmount,
    contract?.address ?? undefined
  )

  const [contractReturn, setContractReturn] = useState<contractReturn>()

  useEffect(() => {
    if (contractReturn && contractReturn.isError && contractReturn.msg) {
      setTimeout(() => {
        setContractReturn(undefined)
      }, 5000)
    }
  }, [contractReturn])

  const [mortgageFeeFindAmount, setMortgageFeeFindAmount] = useState<CurrencyAmount<Token>>();

  const mortgageFeeFooter = useMemo(() => {
    if (!mortgageFeeFindAmount || !mortgageForm.amount) return
    const feeAmount = convFindToA(mortgageForm.outToken, mortgageFeeFindAmount.asFraction)
    return <Stack direction={"row"} justifyContent={"right"} alignItems={"center"} sx={{
      color: "inuse.graytext", fontWeight: 500, fontSize: "14px", lineHeight: "18px", cursor: "pointer"
    }}>
      Fees (0.5%): {feeAmount.toSignificant(6)} {mortgageForm.outToken.symbol}
    </Stack>
  }, [convFindToA, mortgageFeeFindAmount, mortgageForm.amount, mortgageForm.outToken])

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

  const multiplyOSPFeeBox = useMemo(() => {
    if (!account || !multiplyForm.outAmount || !multiplyForm?.amount || !multiplyForm?.multiplyAmount) return undefined
    return <Stack alignItems={"center"} sx={{
      bgcolor: "inuse.secondarytext", color: "inuse.graytext", fontWeight: 500, fontSize: "14px", lineHeight: "18px", borderRadius: "10px"
    }} spacing="8px" >
      <Box sx={{
        fontWeight: 500, fontSize: "14px", color: "inuse.graytext", float: "right", width: "100%", textAlign: "right"
      }}>
        <Trans>Maximum multiplier</Trans> : {formatNumber(parseFloat(multiplyForm?.multiplyAmount) / parseFloat(multiplyForm?.amount), 0)}x = {multiplyForm.outAmount} {multiplyForm.outAsset?.token.symbol}
      </Box>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", color: "inuse.graytext", float: "right", width: "100%", textAlign: "right"
      }}>
        Fees (0.5%): {multiplyForm.feeAmount} {multiplyForm.token.symbol}
      </Box>
    </Stack>
  }, [account, multiplyForm?.amount, multiplyForm.feeAmount, multiplyForm?.multiplyAmount, multiplyForm.outAmount, multiplyForm.outAsset?.token.symbol, multiplyForm.token.symbol])

  const handleChangeTab = useCallback((tab: CurrentTab) => {
    search.set('action', tab)
    setSearchParams(search)
    clearForm()
  }, [clearForm, search, setSearchParams])

  const updateMortgageOut = useCallback((amount?: string, outToken?: Token, token?: TokenData, positionId?: number) => {
    outToken = outToken || mortgageForm.outToken
    token = token || mortgageForm.token
    positionId = positionId || mortgageForm.positionId
    updateMortgageForm({ outAmount: amount, input: InputType.Out, outToken, token, positionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateMortgageForm({ amount: undefined })
      return
    }
    if (token) {
      const findAmount = convAToFind(outToken, getCurrencyAmount(token.token, amount))
      targetMortgageOutFind(findAmount, positionId, (a: any) => updateMortgageForm({ amount: a.toSignificant(6) }), setMortgageFeeFindAmount)
    }
  }, [convAToFind, mortgageForm.outToken, mortgageForm.positionId, mortgageForm.token, targetMortgageOutFind, updateMortgageForm])

  const updateCashOut = useCallback((amount?: string, outToken?: Token, token?: TokenData, positionId?: number) => {
    outToken = outToken || cashForm.outToken
    token = token || cashForm.token
    positionId = positionId || cashForm.positionId
    updateCashForm({ outAmount: amount, input: InputType.Out, outToken, token, positionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateCashForm({ amount: undefined })
      return
    }
    if (token) {
      const findAmount = convAToFind(outToken, getCurrencyAmount(outToken, amount))
      targetCashOutEarn(findAmount, positionId, token, (a: any) => updateCashForm({ amount: a.toSignificant(6) }))
    }
  }, [cashForm.outToken, cashForm.token, cashForm.positionId, updateCashForm, convAToFind, targetCashOutEarn])

  const cashOutFooter = useMemo(() => {
    if (!account || !cashForm.positionId) return undefined
    const searched = mortgagePositions.find((p) => p.positionId === cashForm.positionId)
    if (!searched) return undefined
    const enarning = searched.findEarning ? convFindToA(cashForm.outToken, searched.findEarning) : undefined
    return <Stack direction={"row"} spacing="25px" sx={{
      alignItems: "center", justifyContent: "space-between",
      cursor: "pointer"
    }}>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext", height: "18.88px"
      }}>
        <Trans>Earning:</Trans>   {enarning?.toSignificant(6) || '0'}
      </Box>
      <Box>
        <Button onClick={() => {
          updateCashOut(enarning?.toExact())
        }} disableElevation sx={{
          p: "3px 2px",
          bgcolor: "#FDEAF1",
          color: "inuse.error",
          fontWeight: 500, fontSize: "9px", lineHeight: "11px",
          height: "17px",
          textTransform: "capitalize",
          "&:hover": {
            bgcolor: "#FDEAF1",
          }
        }} disabled={!searched}>
          <Trans>Maximum</Trans>
        </Button>
      </Box>
    </Stack>
  }, [account, cashForm.outToken, cashForm.positionId, convFindToA, mortgagePositions, updateCashOut])

  const updateRedeemOut = useCallback((amount?: string, outToken?: Token, token?: TokenData, positionId?: number) => {
    outToken = outToken || redeemForm.outToken
    token = token || redeemForm.token
    positionId = positionId || redeemForm.positionId
    updateRedeemForm({ outAmount: amount, input: InputType.Out, outToken, token, positionId })
    if (!amount || parseFloat(amount) === 0 || amount === ".") {
      updateRedeemForm({ amount: undefined })
      return
    }
    if (token) {
      const findAmount = convAToFind(outToken, getCurrencyAmount(outToken, amount))
      targetRedeemOutFind(findAmount, positionId, (a: any) => updateRedeemForm({ amount: a.toSignificant(6) }))
    }
  }, [convAToFind, redeemForm.outToken, redeemForm.positionId, redeemForm.token, targetRedeemOutFind, updateRedeemForm])

  const redeemWithdrawFooter = useMemo(() => {
    if (!account || !redeemForm.positionId) return undefined
    const searched = mortgagePositions.find((p) => p.positionId === redeemForm.positionId)
    return <Stack direction={"row"} spacing="25px" sx={{
      alignItems: "center", justifyContent: "space-between",
      cursor: "pointer"
    }}>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext", height: "18.88px"
      }}>
        <Trans>Locked:</Trans>   {searched?.collLocked?.toSignificant(6) || '0'}
      </Box>
      <Box>
        <Button onClick={() => {
          updateRedeemValue(searched?.collLocked?.toExact())
        }} disableElevation sx={{
          p: "3px 2px",
          bgcolor: "#FDEAF1",
          color: "inuse.error",
          fontWeight: 500, fontSize: "9px", lineHeight: "11px",
          height: "17px",
          textTransform: "capitalize",
          "&:hover": {
            bgcolor: "#FDEAF1",
          }
        }} disabled={!searched}>
          <Trans>Maximum</Trans>
        </Button>
      </Box>
    </Stack>
  }, [account, mortgagePositions, redeemForm.positionId, updateRedeemValue])

  const getNativeValue = useCallback((payAmount?: CurrencyAmount<Token>) => {
    if (payAmount?.currency.address !== nativeOnChain(chainId).wrapped.address) return {}
    return {
      value: BigNumber.from(payAmount.asFraction.quotient.toString())
    }
  }, [chainId])

  const sendTransactionSuccess = useCallback((value: any, event: string, type: "mortgage" | "cash" | "redeem" | "multiply", resetForm: () => void) => {
    value.wait().then((trans: ContractReceipt) => {
      setContractReturn(undefined)
      const e = trans.events?.find((e) => e.event === event)
      if (e) enqueueSnackbar(getHistoryText(chainId, tokensObject, {
        type,
        [type]: type === "multiply" ? e?.args ? e.args[0] : undefined : e?.args
      } as any), {})
    }).catch((reason: any) => {
      setContractReturn({
        isError: true,
        msg: reason.data?.message || reason.message,
      })
    }).finally(() => {
      resetForm()
      setConfirmLoading(false)
    })
    setContractReturn({
      isError: false,
      msg: t`transaction link`,
      link: getScanLink(chainId, value.hash),
    })
  }, [chainId, enqueueSnackbar, tokensObject])

  const sendTransactionFailed = useCallback((reason: any) => {
    setContractReturn({
      isError: true,
      msg: reason.data?.message || reason.message,
    });
    setConfirmLoading(false);
  }, [])

  const mortgage = useCallback(() => {
    if (!mortgageForm.token || !mortgageForm.amount || !contract) return
    setConfirmLoading(true)
    setContractReturn(undefined)
    const path = getPathToFind(chainId, mortgageForm.outToken, true)
    if (mortgageForm.positionId) {
      contract.mortgageAdd(
        mortgageForm.positionId,
        parseUnits(mortgageForm.amount, mortgageForm.token.token.decimals),
        path,
      ).then((value) => sendTransactionSuccess(value, "MortgageEvent", "mortgage", () => setMortgageForm({ outToken: mortgageForm.outToken })))
        .catch(sendTransactionFailed)
    } else {
      contract.mortgage(
        mortgageForm.token.token.address,
        parseUnits(mortgageForm.amount, mortgageForm.token.token.decimals),
        path,
      ).then((value) => sendTransactionSuccess(value, "MortgageEvent", "mortgage", () => setMortgageForm({ outToken: mortgageForm.outToken })))
        .catch(sendTransactionFailed)
    }
  }, [chainId, contract, mortgageForm.amount, mortgageForm.outToken, mortgageForm.positionId, mortgageForm.token, sendTransactionFailed, sendTransactionSuccess, setMortgageForm])

  const cash = useCallback(() => {
    if (!cashForm.token || !cashForm.amount || !contract) return
    setConfirmLoading(true)
    setContractReturn(undefined)
    const path = getPathToFind(chainId, cashForm.outToken, true)
    contract.cash(
      BigNumber.from(cashForm.positionId),
      parseUnits(cashForm.amount, cashForm.token.token.decimals),
      path
    ).then((value) => sendTransactionSuccess(value, "Cash", "cash", () => setCashForm({ outToken: cashForm.outToken })))
      .catch(sendTransactionFailed)
  }, [cashForm.token, cashForm.amount, cashForm.outToken, cashForm.positionId, contract, chainId, sendTransactionFailed, sendTransactionSuccess, setCashForm])

  const redeem = useCallback(() => {
    if (!redeemForm.token || !redeemForm.amount || !redeemForm.outAmount || !contract) return
    setConfirmLoading(true)
    setContractReturn(undefined)
    const path = getPathToFind(chainId, redeemForm.outToken, true)
    // console.log(redeemForm.token.token.address, parseUnits(redeemForm.amount, 18).toString(), BigNumber.from(redeemOutAmount?.asFraction.quotient.toString()).toString(), path)
    contract.redeem(
      BigNumber.from(redeemForm.positionId),
      parseUnits(redeemForm.amount, redeemForm.token.token.decimals),
      BigNumber.from(redeemOutAmount?.asFraction.quotient.toString()),
      path,
      getNativeValue(redeemOutAmount)
    ).then((value) => sendTransactionSuccess(value, "Redeem", "redeem", () => setRedeemForm({ outToken: redeemForm.outToken })))
      .catch(sendTransactionFailed)
  }, [chainId, contract, getNativeValue, redeemForm.amount, redeemForm.outAmount, redeemForm.outToken, redeemForm.positionId, redeemForm.token, redeemOutAmount, sendTransactionFailed, sendTransactionSuccess, setRedeemForm])

  const multiply = useCallback(() => {
    if (!account || !multiplyForm.outAsset || !multiplyForm.amount || !contract) return
    setConfirmLoading(true)
    setContractReturn(undefined)
    const path = getPathToFind(chainId, multiplyForm.token, true)
    console.log([
      multiplyForm.outAsset.token.address,
      multiplyForm.multiplyFindAmount?.quotient.toString(),
      multiplyInAmount?.asFraction.quotient.toString(),
      path,
      multiplyForm.outPositionId,
    ])

    if (multiplyForm.outPositionId) {
      contract.multiplyAdd(
        BigNumber.from(multiplyForm.outPositionId),
        BigNumber.from(multiplyForm.multiplyFindAmount?.quotient.toString()),
        BigNumber.from(multiplyInAmount?.asFraction.quotient.toString()),
        path,
        getNativeValue(multiplyInAmount)
      ).then((value) => sendTransactionSuccess(value, "Multiply", "multiply", () => setMultiplyForm({ token: multiplyForm.token })))
        .catch(sendTransactionFailed)
    } else {
      contract.multiply(
        multiplyForm.outAsset.token.address,
        BigNumber.from(multiplyForm.multiplyFindAmount?.quotient.toString()),
        BigNumber.from(multiplyInAmount?.asFraction.quotient.toString()),
        path,
        getNativeValue(multiplyInAmount)
      ).then((value) => sendTransactionSuccess(value, "Multiply", "multiply", () => setMultiplyForm({ token: multiplyForm.token })))
        .catch(sendTransactionFailed)
    }
  }, [account, multiplyForm.outAsset, multiplyForm.amount, multiplyForm.token, multiplyForm.multiplyFindAmount?.quotient, multiplyForm.outPositionId, contract, chainId, multiplyInAmount, getNativeValue, sendTransactionFailed, sendTransactionSuccess, setMultiplyForm])

  const confirmButton = useMemo(() => {
    const ButtonSX = {
      width: "100%",
      borderRadius: "32px",
      mt: "24px", 
    }
    if (currentTab === CurrentTab.mortgage) {
      if (!mortgageForm.token || !mortgageOSPAmount || mortgageOSPAmount.equalTo(0)) {
        return <Button disabled disableElevation variant="contained" size="large" sx={ButtonSX}>
          <Trans>Confirm</Trans>
        </Button>
      }
      if (balancesMap?.[mortgageForm.token?.token.address]?.lessThan(mortgageOSPAmount))
        return (
          <Button variant="contained" size="large" disableElevation sx={ButtonSX} disabled>
            <Trans>Insufficient Balance</Trans>
          </Button>
        );
      if (mortgageApproval !== ApprovalState.APPROVED) {
        return <ApproveButton
          size="large"
          spender={contract.address}
          tokenAmount={mortgageOSPAmount}
          chainId={chainId}
          sx={ButtonSX}
        />
      }
      return <LoadingButton loading={confirmLoading} onClick={mortgage} disableElevation variant="contained" size="large" sx={ButtonSX}>
        <Trans>Confirm</Trans>
      </LoadingButton>
    }
    if (currentTab === CurrentTab.cash) {
      if (!cashForm.token || !cashOSPAmount || cashOSPAmount.equalTo(0) || !cashForm.outAmount || cashForm.outAmount === "0") {
        return <Button disabled disableElevation variant="contained" size="large" sx={ButtonSX}>
          <Trans>Confirm</Trans>
        </Button>
      }
      const position = mortgagePositions.find((p) => p.positionId === cashForm.positionId)
      if (!position?.collLocked || position.collLocked.lessThan(CurrencyAmount.fromRawAmount(cashForm.token.token, parseUnits(cashForm.amount || '0', cashForm.token.token.decimals).toString())))
        return (
          <Button variant="contained" size="large" disableElevation sx={ButtonSX} disabled>
            <Trans>Insufficient Collateral Locked</Trans>
          </Button>
        );
      if (!cashForm.outAmount) {
        return (
          <Button variant="contained" size="large" disableElevation sx={ButtonSX} disabled>
            <Trans>No Earning</Trans>
          </Button>
        );
      }
      return <LoadingButton loading={confirmLoading} onClick={cash} disableElevation variant="contained" size="large" sx={ButtonSX}>
        <Trans>Confirm</Trans>
      </LoadingButton>
    }
    if (currentTab === CurrentTab.redeem) {
      if (!redeemForm.token || !redeemOutAmount || redeemOutAmount.equalTo(0)) {
        return <Button disabled disableElevation variant="contained" size="large" sx={ButtonSX}>
          <Trans>Confirm</Trans>
        </Button>
      }
      const position = mortgagePositions.find((p) => p.positionId === redeemForm.positionId)
      if (!position?.collLocked || position.collLocked.lessThan(CurrencyAmount.fromRawAmount(redeemForm.token.token, parseUnits(redeemForm.amount || '0', redeemForm.token.token.decimals).toString())))
        return (
          <Button variant="contained" size="large" disableElevation sx={ButtonSX} disabled>
            <Trans>Insufficient Collateral Locked</Trans>
          </Button>
        );

      if (balancesMap?.[redeemForm.outToken.address]?.lessThan(redeemOutAmount))
        return (
          <Button variant="contained" size="large" disableElevation sx={ButtonSX} disabled>
            <Trans>Insufficient Balance</Trans>
          </Button>
        );

      if (redeemApproval !== ApprovalState.APPROVED) {
        return <ApproveButton
          size="large"
          spender={contract.address}
          tokenAmount={redeemOutAmount}
          chainId={chainId}
          sx={ButtonSX}
        />
      }
      // console.log(redeemOutAmount.toExact(), redeemOutAmount.currency.symbol, redeemApproval)
      return <LoadingButton loading={confirmLoading} onClick={redeem} disableElevation variant="contained" size="large" sx={ButtonSX}>
        <Trans>Confirm</Trans>
      </LoadingButton>
    }
    if (currentTab === CurrentTab.multiply) {
      if (!multiplyForm.token || !multiplyInAmount || multiplyInAmount.equalTo(0)) {
        return <Button disabled disableElevation variant="contained" size="large" sx={ButtonSX}>
          <Trans>Confirm</Trans>
        </Button>
      }
      if (balancesMap?.[multiplyForm.token.address]?.lessThan(multiplyInAmount))
        return (
          <Button variant="contained" size="large" disableElevation sx={ButtonSX} disabled>
            <Trans>Insufficient Balance</Trans>
          </Button>
        );
      if (multiplyApproval !== ApprovalState.APPROVED) {
        return <ApproveButton
          size="large"
          spender={contract?.address}
          tokenAmount={multiplyInAmount}
          chainId={chainId}
          sx={ButtonSX}
        />
      }
      return <LoadingButton loading={confirmLoading} onClick={multiply} disableElevation variant="contained" size="large" sx={ButtonSX}>
        <Trans>Confirm</Trans>
      </LoadingButton>
    }
    return <></>
  }, [balancesMap, cash, cashForm.amount, cashForm.outAmount, cashForm.positionId, cashForm.token, cashOSPAmount, chainId, confirmLoading, contract.address, currentTab, mortgage, mortgageApproval, mortgageForm.token, mortgageOSPAmount, mortgagePositions, multiply, multiplyApproval, multiplyForm.token, multiplyInAmount, redeem, redeemApproval, redeemForm.amount, redeemForm.outToken.address, redeemForm.positionId, redeemForm.token, redeemOutAmount])
  
  const [assetAnchorEl, setAssetAnchorEl] = useState<null | HTMLElement>(null)
  const [positionAnchorEl, setPositionAnchorEl] = useState<null | HTMLElement>(null)
  const [clickAsset, setClickAsset] = useState<string>()
  const [clickPosition, setClickPosition] = useState<Position>()
  const [, copy] = useCopyToClipboard()

  const handleChangePairToken = useCallback((outTokenId: SelectToken) => {
    const outToken = getSelectToken(outTokenId)[chainId]
    if (currentTab === CurrentTab.mortgage) {
      updateMortgageForm({ outToken })
      if (mortgageForm.outAmount && mortgageForm.input === InputType.Out) updateMortgageOut(mortgageForm.outAmount, outToken)
      if (mortgageForm.amount && mortgageForm.input === InputType.In) updateMortgageValue(mortgageForm.amount, outToken)
    }
    if (currentTab === CurrentTab.cash) {
      updateCashForm({ outToken })
      if (cashForm.outAmount && cashForm.input === InputType.Out) updateCashOut(cashForm.outAmount, outToken)
      if (cashForm.amount && cashForm.input === InputType.In) updateCashValue(cashForm.amount, outToken)
    }
    if (currentTab === CurrentTab.redeem) {
      updateRedeemForm({ outToken })
      if (redeemForm.outAmount && redeemForm.input === InputType.Out) updateRedeemOut(redeemForm.outAmount, outToken)
      if (redeemForm.amount && redeemForm.input === InputType.In) updateRedeemValue(redeemForm.amount, outToken)
    }
    if (currentTab === CurrentTab.multiply) {
      updateMultiplyForm({ token: outToken })
      if (multiplyForm.amount && multiplyForm.input === InputType.In) updateMultiplyValue(multiplyForm.amount, outToken)
    }
  }, [cashForm.amount, cashForm.input, cashForm.outAmount, chainId, currentTab, mortgageForm.amount, mortgageForm.input, mortgageForm.outAmount, multiplyForm.amount, multiplyForm.input, redeemForm.amount, redeemForm.input, redeemForm.outAmount, updateCashForm, updateCashOut, updateCashValue, updateMortgageForm, updateMortgageOut, updateMortgageValue, updateMultiplyForm, updateMultiplyValue, updateRedeemForm, updateRedeemOut, updateRedeemValue])
  
  const updateToken = useCallback((token?: TokenData, positionId?: number) => {
    console.log('updateToken', token, positionId)
    if (currentTab === CurrentTab.mortgage) {
      // TODO: no need to update form
      updateMortgageForm({ token, positionId })
      if (mortgageForm.outAmount && mortgageForm.input === InputType.Out) updateMortgageOut(mortgageForm.outAmount, undefined, token, positionId)
      if (mortgageForm.amount && mortgageForm.input === InputType.In) updateMortgageValue(mortgageForm.amount, undefined, token, positionId)
    }
    if (currentTab === CurrentTab.cash) {
      updateCashForm({ token, positionId })
      if (cashForm.outAmount && cashForm.input === InputType.Out) updateCashOut(cashForm.outAmount, undefined, token, positionId)
      if (cashForm.amount && cashForm.input === InputType.In) updateCashValue(cashForm.amount, undefined, token, positionId)
    }
    if (currentTab === CurrentTab.redeem) {
      updateRedeemForm({ token, positionId })
      if (redeemForm.outAmount && redeemForm.input === InputType.Out) updateRedeemOut(redeemForm.outAmount, undefined, token, positionId)
      if (redeemForm.amount && redeemForm.input === InputType.In) updateRedeemValue(redeemForm.amount, undefined, token, positionId)
    }
    if (currentTab === CurrentTab.multiply) {
      updateMultiplyForm({ outAsset: token, outPositionId: positionId })
      if (multiplyForm.amount && multiplyForm.input === InputType.In) updateMultiplyValue(multiplyForm.amount, undefined, token, positionId)
    }
  }, [cashForm.amount, cashForm.input, cashForm.outAmount, currentTab, mortgageForm.amount, mortgageForm.input, mortgageForm.outAmount, multiplyForm.amount, multiplyForm.input, redeemForm.amount, redeemForm.input, redeemForm.outAmount, updateCashForm, updateCashOut, updateCashValue, updateMortgageForm, updateMortgageOut, updateMortgageValue, updateMultiplyForm, updateMultiplyValue, updateRedeemForm, updateRedeemOut, updateRedeemValue])
  
  const disabledPairSelect = useMemo(() => {
    if (currentTab === CurrentTab.mortgage) {
      return !!!mortgageForm.token
    }
    if (currentTab === CurrentTab.cash) {
      return !!!cashForm.token
    }
    if (currentTab === CurrentTab.redeem) {
      return !!!redeemForm.token
    }
    return false
  }, [cashForm.token, currentTab, mortgageForm.token, redeemForm.token])

  const pairTokenValue = useMemo(() => {
    if (currentTab === CurrentTab.mortgage) {
      return mortgageForm.outToken
    }
    if (currentTab === CurrentTab.cash) {
      return cashForm.outToken
    }
    if (currentTab === CurrentTab.redeem) {
      return redeemForm.outToken
    }
    if (currentTab === CurrentTab.multiply) {
      return multiplyForm.token
    }
    return undefined
  }, [cashForm.outToken, currentTab, mortgageForm.outToken, multiplyForm.token, redeemForm.outToken])

  const selectPairToken = useMemo(() => {
    if (!pairTokenValue) return
    const value = getSelectTokenByAddress(chainId, pairTokenValue.address) || SelectToken.WETH
    return <PairTokenSelect
      options={[SelectToken.WETH, SelectToken.FIND]}
      value={value}
      onSelect={handleChangePairToken}
      disabledSelect={disabledPairSelect}
    />
  }, [chainId, disabledPairSelect, handleChangePairToken, pairTokenValue])

  const currentSelectToken = useMemo(() => {
    if (currentTab === CurrentTab.mortgage) {
      return mortgageForm.token
    }
    if (currentTab === CurrentTab.cash) {
      return cashForm.token
    }
    if (currentTab === CurrentTab.redeem) {
      return redeemForm.token
    }
    if (currentTab === CurrentTab.multiply) {
      return multiplyForm.outAsset
    }
  }, [cashForm.token, currentTab, mortgageForm.token, multiplyForm.outAsset, redeemForm.token])

  const currentSelectPositionId = useMemo(() => {
    if (currentTab === CurrentTab.mortgage) {
      return mortgageForm.positionId
    }
    if (currentTab === CurrentTab.cash) {
      return cashForm.positionId
    }
    if (currentTab === CurrentTab.redeem) {
      return redeemForm.positionId
    }
    if (currentTab === CurrentTab.multiply) {
      return multiplyForm.outPositionId
    }
  }, [cashForm.positionId, currentTab, mortgageForm.positionId, multiplyForm.outPositionId, redeemForm.positionId])

  const introBox = useMemo(() => {
    if (currentTab === CurrentTab.mortgage) {
      return <Box>
        <ul style={{
          paddingLeft: "20px", fontWeight: 400, fontSize: "14px", lineHeight: "24px", color: "#9F9F9D",
          marginTop: "0"
        }}>
          <li><Trans>You can mortgage HBG token to lend $ETH or $FIND for a 0.5% fee.</Trans></li>
          <li><Trans>It is characterized by no forced closing, no interest, no time limit, and risk-free.</Trans></li>
          <li><Trans>Risk-free definition: public chain ( Ethereum etc. ) trusted, Uniswap trusted, 0xfind smart contract no bugs.</Trans></li>
        </ul>
      </Box>
    }
    if (currentTab === CurrentTab.cash) {
      return <Box>
        <ul style={{
          paddingLeft: "20px", fontWeight: 400, fontSize: "14px", lineHeight: "24px", color: "#9F9F9D",
          marginTop: "0"
        }}>
          <li><Trans>You can combine the two transactions of redeeming HBG and then selling HBG into one Cash operation, so you can cash out even if you don't have $ETH and $FIND.</Trans></li>
          <li><Trans>Cash operations will close out the entered collateral.</Trans></li>
        </ul>
      </Box>
    }
    if (currentTab === CurrentTab.redeem) {
      return <Box>
        <ul style={{
          paddingLeft: "20px", fontWeight: 400, fontSize: "14px", lineHeight: "24px", color: "#9F9F9D",
          marginTop: "0"
        }}>
          <li><Trans>You can repay $ETH or $FIND and withdraw the mortgaged HBG tokens.</Trans></li>
        </ul>
      </Box>
    }
    if (currentTab === CurrentTab.multiply) {
      return <Box>
        <ul style={{
          paddingLeft: "20px", fontWeight: 400, fontSize: "14px", lineHeight: "24px", color: "#9F9F9D",
          marginTop: "0"
        }}>
          <li><Trans>You can mortgage to get $ETH or $FIND, buy HBG again and keep repeating this operation. multiply combines such operations into one to save a lot of gas fee.</Trans></li>
          <li><Trans>After multiply, the position is obtained.</Trans></li>
        </ul>
      </Box>
    }
    return <></>
  }, [currentTab])

  useEffect(() => {
    if (search.get('token')) {
      const token = tokensObject[search.get('token') || '']
      if (token && token.pool) {
        const injectPositionId = !!search.get('position')
        const positionId = injectPositionId ? parseInt(search.get('position') || '') : getPositionIdByOsp(token.id.toLowerCase())
        if (
          !currentSelectToken?.token ||
          !token.token.equals(currentSelectToken?.token) ||
          currentSelectPositionId !== positionId
        ) updateToken(token, positionId)
      }
    }
    if (search.get('action')) {
      setCurrentTab(search.get('action') as CurrentTab)
    }
  }, [currentSelectToken?.token, currentSelectPositionId, getPositionIdByOsp, search, tokensObject, updateToken])

  return <Box sx={{
    bgcolor: "inuse.secondarytext", pt: "80px", pb: "80px", minHeight: "calc(100vh - 64px)",
  }}>
    <Box sx={{
      // width: "1200px",
      minWidth: "0px",
      maxWidth: "1200px",
      m: "0 auto 0 auto"
    }}>
      <SelectTokenDialog
        open={selectTokenDialog}
        onClose={() => setSelectTokenDialog(false)}
        assets={assets}
        onClick={handleClickTokenDialog}
      />
      <MortgageHistoryDialog
        open={historyDialog}
        onClose={() => setHistoryDialog(false)}
        histories={historyData} />
      <Stack direction={"row"}>
        <Stack spacing={"50px"}>
          <MortgageCard width="700px" minHeight={"268px"} maxHeight={"268px"}>
            <Stack direction={"row"} spacing={"24px"} sx={{ height: '100%' }}>
              <Stack spacing={"10px"} sx={{ width: '230px' }} >
                <Box sx={{
                  fontWeight: 700, fontSize: "18px", lineHeight: "24px"
                }}><Trans>Total Assets</Trans></Box>
                <Box sx={{
                  fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: "inuse.graytext"
                }}><Trans>Calculated using the all HBG token</Trans></Box>
                <Box sx={{
                  fontWeight: 400, fontSize: "36px", lineHeight: "48px"
                }}>
                  <CurrencyText base={SupportedCurrency.USD}>{totalAssetsUSD}</CurrencyText>
                </Box>
              </Stack>
              <Divider orientation="vertical" variant="middle" sx={{ borderColor: "inuse.secondarytext" }} />
              <Stack spacing={"21px"} sx={{ width: "330px" }}>
                <Box sx={{
                  fontWeight: 700, fontSize: "18px", lineHeight: "24px"
                }}><Trans>All HBG tokens</Trans></Box>
                {nzAssets.length === 0 ? <EmptyRow title={<Trans>There is no HBG token</Trans>} /> : 
                  <Stack spacing={"14px"} sx={{ width: "348px", height: "138px", overflowY: "scroll", "::-webkit-scrollbar": {
                    width: "2px", bgcolor: "inuse.text"
                  }, "::-webkit-scrollbar-thumb": {
                    bgcolor: "inuse.scrollbg"
                  } }}>
                    {nzAssets.map((asset, i) => (<Stack key={i} direction={"row"} spacing={"8px"} sx={{
                      alignItems: "center"
                    }}>
                      {asset.logo ? <Avatar sx={{ width: 24, height: 24 }} src={asset.logo} /> : <FINDCoinIcon sx={{ width: 24, height: 24 }} />}
                      <CommonTooltip title={<Box>
                        {asset.token.symbol} <Box sx={{ color: "inuse.graytext" }}>{asset.token.github.replace("https://", "")}</Box>
                      </Box>} placement="top">
                        <Box sx={{
                          fontWeight: 500, fontSize: "14px", lineHeight: "24px", width: "100px", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", cursor: "pointer"
                        }}>{asset.token.symbol}</Box>
                      </CommonTooltip>
                      <TooltipBox width="76px">{formatNumber(asset.amount)}</TooltipBox>
                      <TooltipBox width="76px">(<CurrencyText base={SupportedCurrency.USD}>{asset.valueUSD}</CurrencyText>)</TooltipBox>
                      <Button sx={{
                        p: "0", width: "24px", height: "24px"
                      }} onClick={(event) => {
                        setClickAsset(asset.token.id)
                        setAssetAnchorEl(event.currentTarget)
                      }}>
                        <VerticalSettingIcon sx={{ color: "inuse.blacktext" }} />
                      </Button>
                    </Stack>))}
                  </Stack>
                }
                <Menu
                  anchorEl={assetAnchorEl}
                  open={Boolean(assetAnchorEl) && !!clickAsset}
                  onClose={() => setAssetAnchorEl(null)}
                  onClick={() => setAssetAnchorEl(null)}
                  MenuListProps={{
                    variant: "selectedMenu",
                    autoFocusItem: true,
                  }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      bgcolor: "inuse.text",
                      boxShadow: "0 4px 4px rgba(141, 141, 141, 0.25)",
                      borderRadius: "10px",
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                    },
                  }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                  }}
                >
                  <CustomMenuItem key="copy_addr" value="copy_addr" onClick={() => copy(clickAsset || '')}>
                    <AddressCopyText color="inuse.blacktext" text={clickAsset || ''} content={`${clickAsset?.substring(0, 6)}...${clickAsset?.slice(-4)}`} copy={copy} />
                  </CustomMenuItem>
                  <CustomMenuItem key="swap" value="swap" onClick={() => window.open(getSwapLink(chainId, WETH[chainId].address, clickAsset || ''), "_blank")}>
                    <Trans>Swap</Trans>
                  </CustomMenuItem>
                  {clickAsset !== FIND[chainId].address.toLowerCase() && <CustomMenuItem key="mortgage" value="mortgage" onClick={() => handleClickMenu(clickAsset, CurrentTab.mortgage)}>
                    <Trans>Mortgage</Trans>
                  </CustomMenuItem>}
                </Menu>
              </Stack>
            </Stack>
          </MortgageCard>
          <MortgageCard width="700px" minHeight={"428px"} maxHeight={"428px"}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"baseline"} sx={{ mb: '20px' }}>
              <Box sx={{
                fontWeight: 600, fontSize: "18px", lineHeight: "24px"
              }}><Trans>Deposit Positions</Trans></Box>
              <Stack direction={"row"} alignItems={"center"} spacing={"3px"}>
                <Box sx={{ 
                  color: "inuse.graytext"
                }}><Trans>Total Earning:</Trans></Box>
                <Box>
                  { mortgagePositionsLoading ? <PulseLoader size={6} /> : 
                  <CurrencyText>{parseFloat(mortgagePositionsTotalEarning?.toSignificant(6) || '0')}</CurrencyText> }
                </Box>
              </Stack>
            </Stack>
            <MortgageTable loading={mortgagePositionsLoading} data={mortgagePositions} onClick={(event, position) => {
              setClickPosition(position)
              setPositionAnchorEl(event.currentTarget)
            }} />
            <Menu
              anchorEl={positionAnchorEl}
              open={Boolean(positionAnchorEl) && !!clickPosition}
              onClose={() => setPositionAnchorEl(null)}
              onClick={() => setPositionAnchorEl(null)}
              MenuListProps={{
                variant: "selectedMenu",
                autoFocusItem: true,
              }}
              PaperProps={{
                elevation: 0,
                sx: {
                  bgcolor: "inuse.text",
                  boxShadow: "0 4px 4px rgba(141, 141, 141, 0.25)",
                  borderRadius: "10px",
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
              }}
            >
              <CustomMenuItem key="swap" value="swap" onClick={() => window.open(getSwapLink(chainId, WETH[chainId].address, clickPosition?.token?.id || ''), "_blank")}>
                <Trans>Swap</Trans>
              </CustomMenuItem>
              <CustomMenuItem key="cash" value="cash" onClick={() => handleClickMenu(clickPosition?.token?.id, CurrentTab.cash, clickPosition?.positionId)}>
                <Trans>Cash</Trans>
              </CustomMenuItem>
              <CustomMenuItem key="redeem" value="redeem" onClick={() => handleClickMenu(clickPosition?.token?.id, CurrentTab.redeem, clickPosition?.positionId)}>
                <Trans>Redeem</Trans>
              </CustomMenuItem>
            </Menu>
          </MortgageCard>
        </Stack>

        <Stack sx={{
          ml: "50px"
        }}>
          <MortgageCard width={"503px"}>
            <Box sx={{
              fontWeight: 700, fontSize: "18px", lineHeight: "24px"
            }}><Trans>Manage Your Assets</Trans></Box>

            <Stack direction={"row"} spacing="8px" sx={{
              justifyContent: "center", width: "100%", mt: "46px"
            }}>
              <SelectButton selected={currentTab === CurrentTab.mortgage} onClick={() => handleChangeTab(CurrentTab.mortgage)}>
                <Trans>Mortgage</Trans>
              </SelectButton>
              <SelectButton selected={currentTab === CurrentTab.redeem} onClick={() => handleChangeTab(CurrentTab.redeem)}>
                <Trans>Redeem</Trans>
              </SelectButton>
              <SelectButton selected={currentTab === CurrentTab.multiply} onClick={() => handleChangeTab(CurrentTab.multiply)}>
                <Trans>Multiply</Trans>
              </SelectButton>
              <SelectButton selected={currentTab === CurrentTab.cash} onClick={() => handleChangeTab(CurrentTab.cash)}>
                <Trans>Cash</Trans>
              </SelectButton>
            </Stack>

            <SwipeableViews
              index={currentTab === CurrentTab.mortgage ? 0 : currentTab === CurrentTab.redeem ? 1 : currentTab === CurrentTab.multiply ? 2 : 3}
              style={{ marginTop: "24px", minHeight: "247px", width: "100%" }}
            >
              <Box>
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg",
                  mb: "9px",
                }}><Trans>Mortgage</Trans></Box>
                <AssetInput
                  value={mortgageForm.amount}
                  loading={mortgageOutFindLoading}
                  onChange={updateMortgageValue}
                  select={mortgageForm.token}
                  onSelect={() => setSelectTokenDialog(true)}
                  footer={mortgageFooter}
                  disabledInput={!!!mortgageForm.token}
                  min={0}
                />
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg", mt: "10px", mb: "9px"
                }}><Trans>Lend out</Trans></Box>
                <AssetInput
                  value={mortgageForm.outAmount}
                  loading={mortgageInOspLoading}
                  selectDom={selectPairToken}
                  onChange={updateMortgageOut}
                  min={0}
                  disabledInput={!!!mortgageForm.token}
                  disabledSelect
                  footer={mortgageFeeFooter}
                />
              </Box>
              <Box>
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg", mb: "9px"
                }}><Trans>Withdraw</Trans></Box>
                <AssetInput
                  min={0}
                  value={redeemForm.amount}
                  loading={mortgageOutFindLoading}
                  onChange={updateRedeemValue}
                  select={redeemForm.token}
                  onSelect={() => setSelectTokenDialog(true)}
                  disabledInput={!!!redeemForm.token}
                  footer={redeemWithdrawFooter}
                />
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg",
                  mb: "9px", mt: "10px", 
                }}><Trans>Repay</Trans></Box>
                <AssetInput
                  min={0}
                  value={redeemForm.outAmount}
                  loading={mortgageInOspLoading}
                  onChange={updateRedeemOut}
                  selectDom={selectPairToken}
                  disabledSelect
                  footer={redeemOutFooter}
                />
              </Box>
              <Box>
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg",
                  mb: "9px",
                }}><Trans>Amount</Trans></Box>
                <AssetInput
                  min={0}
                  value={multiplyForm.amount}
                  onChange={updateMultiplyValue}
                  selectDom={selectPairToken}
                  disabledSelect
                  footer={multiplyInFooter}
                />
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg", mt: "10px", mb: "9px"
                }}><Trans>Mortgage</Trans></Box>
                <AssetInput
                  min={0}
                  value={multiplyForm.outAmount}
                  loading={multiplyInFindLoading}
                  select={multiplyForm.outAsset}
                  onSelect={() => setSelectTokenDialog(true)}
                  disabledInput={true}
                  footer={multiplyOSPFeeBox}
                />
              </Box>
              <Box>
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg",
                  mb: "9px",
                }}><Trans>Collateral</Trans></Box>
                <AssetInput
                  value={cashForm.amount}
                  loading={mortgageOutFindLoading}
                  onChange={updateCashValue}
                  select={cashForm.token}
                  onSelect={() => setSelectTokenDialog(true)}
                  footer={cashFooter}
                  disabledInput={!!!cashForm.token}
                  min={0}
                />
                <Box sx={{
                  fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.inputbg", mt: "10px", mb: "9px"
                }}><Trans>Cash out</Trans></Box>
                <AssetInput
                  value={cashForm.outAmount}
                  loading={mortgageInOspLoading}
                  selectDom={selectPairToken}
                  onChange={updateCashOut}
                  min={0}
                  disabledInput={!!!cashForm.token}
                  footer={cashOutFooter}
                  disabledSelect
                />
              </Box>
            </SwipeableViews>

            {confirmButton}

            {contractReturn?.isError ? (
              <Box
                sx={{
                  textAlign: "center",
                  width: "100%",
                  color: contractReturn.color ?? "#B32F3D",
                  mt: "12px",
                  mb: "25px",
                }}
              >
                {contractReturn.msg}
              </Box>
            ) : (
              <Box
                sx={{ textAlign: "center", width: "100%", mt: "12px", mb: "25px" }}
              >
                <a
                  href={contractReturn?.link}
                  target={"_blank"}
                  rel={"noreferrer"}
                  style={{
                    fontSize: "0.875rem",
                    color: "#444A9E",
                    textDecoration: "underline",
                  }}
                >
                  {contractReturn?.msg}
                </a>
              </Box>
            )}

            <Box sx={{
              display: "flex", justifyContent: "center", alignItems: "center", mt: "20px", mb: "20px"
            }}>
              <LoadingButton loading={loadingOperationHistories} onClick={handleClickHistory} sx={{
                color: "inuse.linktext"
              }}>
                <Trans>History List</Trans>
              </LoadingButton>
            </Box>

            {introBox}

          </MortgageCard>
        </Stack>
      </Stack>
    </Box>
  </Box>
}

export default Assets;