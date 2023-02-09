import { Box, Button, Collapse, Link, Skeleton, Stack } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { t, Trans } from "@lingui/macro";
import { useCallback, useEffect, useMemo, useState } from "react";

import cNFT from "./assets/cNFT.png"
import { ArrowRightIcon } from "../../components/Icons"
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { CreateFormData, FormLabel } from "../../components/Form/Common";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { DEFAULT_TOKEN, getSelectToken, getSelectTokenName, SelectToken, SelectTokenChainToFindPoolFee, SelectTokenIDs, SelectTokenSlippage } from "../../constants/token";
import useSetState from "../../hooks/useSetState";
import { useUserSaveGithubOrgAuthMutation, useUserGithubOrgAuthMutation, useUserGetGithubRepoInfoMutation } from "../../state/service/generatedUserApi";
import { useSignatureGetTokenUnitPriceMutation } from "../../state/service/generatedSignatureApi";
import { currentChainId, supportedChainId2Name, supportedChainName2Id } from "../../constants/chains";
import { CurrencyAmount, Fraction } from "@uniswap/sdk-core";
import { parseUnits } from "ethers/lib/utils";
import { LoadingButton } from "@mui/lab";
import { useNavigate, useSearchParams } from "react-router-dom";
import ConnectWalletButton from "../../components/Button/ConnectWallet";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { ApprovalState, useApprovalStateForSpender } from "../../hooks/useApproval";
import { useFindFactoryContract } from "../../hooks/useContract";
import { useTokenBalancesWithLoadingIndicator } from "../../hooks/useCurrencyBalance";
import ApproveButton from "../../components/Button/Approve";
import useCreateOSP, { CreateDoneSignal } from "../../hooks/useCreateOSP";
import { MultiplyTokenInput, GithubInput, GithubInputReg, NFTPriceInput } from "../../components/Input/Common";
import { CreateButton, CreateButtonSX } from "../../components/Button/Common";
import { TokenNameInput } from "../../components/Select/Common";
import JSBI from "jsbi"
import { multiplyInFindWithInit } from "../../utils/mortgage";
import { VideoLink } from "../../components/Link/Common";
import usePriceConv from "../../hooks/usePriceConv";
import ClipLoader from "react-spinners/ClipLoader";
import { CustomDialog, CustomDialogTitle } from "../../components/Dialog";
import Share from "../../components/Share";
import { ShareItems } from "../../constants/share";
import { OSP_CNFT_PERCENT, OSP_INIT_EXCHANGE, OSP_ONFT_PERCENT, OSP_POOL_FEE_PERCENT, OSP_TOKENNAME_PREFIX } from "../../constants";
import { setWalletOpenModal } from "../../state/application/reducer";
import { getAmountPayMax, getFractionFromUnit, getOrgName } from "../../utils";
import { CommonTooltip } from "../../components/Tooltip/Common";
import { useLocalsInfo } from "../../hooks/useLocales";
import { getOpenseaLink } from "../../constants/link";

const getTokenName = (github: string) => {
  const match = github.match(GithubInputReg);
  if (match === null) return
  const [, owner, repo] = match;
  if (owner.toLowerCase() === repo.toLowerCase()) return `${OSP_TOKENNAME_PREFIX}${owner.toUpperCase()}`
  return `${OSP_TOKENNAME_PREFIX}${owner.toUpperCase()}/${repo.toUpperCase()}`;
}

const Create = () => {
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId));
  const [formData, updateFormData, setFormData] = useSetState<CreateFormData>({ pairToken: DEFAULT_TOKEN[chainId] });
  const [githubInputValue, setGithubInputValue] = useState<string>() // only show input value, not real formData.github
  const [disabledFree, setDisabledFree] = useState<boolean>(false)
  const [existedTokenName, setExistedTokenName] = useState<Record<string, string>>({})
  const [multiplyCollapse, setMultiplyCollapse] = useState<boolean>(false)
  const [
    targetGetTokenUnitPrice,
    { isLoading: getTokenUnitPriceLoading, data: getTokenUnitPriceData },
  ] = useSignatureGetTokenUnitPriceMutation()

  const { account } = useActiveWeb3React()
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!account) dispatch(setWalletOpenModal(true))
    if (account) dispatch(setWalletOpenModal(false))
  }, [account, dispatch])

  const [targetGetGithubRepoInfo, {
    isLoading: getGithubRepoLoading,
    reset: resetGetGithubRepo,
  }] = useUserGetGithubRepoInfoMutation()

  const [selectTokenID, selectFee, selectSlippage] = useMemo(() => {
    const tid = SelectTokenIDs.find(t => getSelectToken(t)[chainId] === formData.pairToken) || SelectToken.FIND
    return [
      tid,
      SelectTokenChainToFindPoolFee[tid] ? SelectTokenChainToFindPoolFee[tid][chainId].toString() : "0",
      SelectTokenSlippage[tid]
    ]
  }, [chainId, formData.pairToken])

  const handleGithubInputChange = useCallback((value: string) => {
    setGithubInputValue(value)
    setFormData({ pairToken: DEFAULT_TOKEN[chainId] })
    if (!value) {
      return
    }
    if (!GithubInputReg.test(value)) {
      updateFormData({ githubErrorTips: t`Please enter a valid GitHub URL` })
      return
    }
    const githubSplit = value.replace("https://", "").split("/")
    resetGetGithubRepo()
    targetGetGithubRepoInfo({
      v1GetGithubRepoInfoRequest: { chainId: supportedChainId2Name(chainId), owner: githubSplit[1], repo: githubSplit[2] }
    }).unwrap().then((d) => {
      if (d.existedId) {
        updateFormData({ githubErrorTips: t`This repository has already been created`, githubExistedId: d.existedId })
        return
      }
      if (d.symbolCheck) {
        setExistedTokenName(d.symbolCheck.reduce((acc: any, cur) => {
          acc[cur.symbol || ''] = cur.id
          return acc
        }, {} as Record<string, string>))
      }
      targetGetTokenUnitPrice({
        v1GetTokenUnitPriceRequest: {
          chainId: supportedChainId2Name(chainId),
          selectToken: formData.pairToken.address,
          selectFee,
          stars: (d.stars || '0').toString()
        }
      })
      let tokenName
      const match = value.match(GithubInputReg)
      if (match !== null) {
        tokenName = getTokenName(value)
      }
      updateFormData({ github: value, githubLogo: d.logo, githubStars: d.stars, tokenName, githubErrorTips: undefined })
    }).catch(() => {
      updateFormData({ githubErrorTips: t`Please enter a valid GitHub URL` })
    }).finally(() => setDisabledFree(false))
  }, [chainId, formData.pairToken.address, resetGetGithubRepo, selectFee, setFormData, targetGetGithubRepoInfo, targetGetTokenUnitPrice, updateFormData])

  const handlePairTokenChange = useCallback((tokenName: SelectToken) => {
    const token = getSelectToken(tokenName)[chainId]
    updateFormData({ pairToken: token })
  }, [chainId, updateFormData])

  const [buyNFTFindAmount, setBuyNFTFindAmount] = useState<Fraction>()
  useEffect(() => {
    if (formData.github && !formData.githubErrorTips)
      targetGetTokenUnitPrice({
        v1GetTokenUnitPriceRequest: {
          chainId: supportedChainId2Name(chainId),
          selectToken: formData.pairToken.address,
          selectFee,
          stars: (formData?.githubStars || '0').toString()
        }
      }).unwrap().then((d) => {
        updateFormData({ nftPrice: d.buyNftTokenAmountMax, nftPriceDiscounted: d.buyNftTokenDiscounted })
        setBuyNFTFindAmount(new Fraction(d.buyNftTokenDiscounted || '0').divide("1".padEnd(formData.pairToken.decimals + 1, '0')).multiply(1e18).divide(getFractionFromUnit(d.unitPrice || "1")).add(d.buyNftFindAmount || '0'))
      })
  }, [chainId, formData.github, formData.githubErrorTips, formData?.githubStars, formData.pairToken.address, formData.pairToken.decimals, selectFee, targetGetTokenUnitPrice, updateFormData])

  const nftPriceCurrency = useMemo(() => CurrencyAmount.fromRawAmount(formData.pairToken, formData.nftPrice || '0'), [formData.nftPrice, formData.pairToken])
  const payDiscounted = useMemo(() => CurrencyAmount.fromRawAmount(formData.pairToken, JSBI.BigInt(formData.nftPriceDiscounted || '0')), [formData.nftPriceDiscounted, formData.pairToken])
  const nftPriceOriginalCurrency = useMemo(() => payDiscounted.currency.equals(nftPriceCurrency.currency) ? nftPriceCurrency.add(payDiscounted) : nftPriceCurrency, [nftPriceCurrency, payDiscounted])

  const findPrice = useAppSelector((state) => state.price.findPrice)

  const [targetSaveGithubOrgAuth, { isLoading: saveGithubOrgAuthLoading }] = useUserSaveGithubOrgAuthMutation()

  const freeForOwnerURL = useCallback((state?: string) => {
    if (!formData.github || !formData.nftPrice) return ""
    const searchParams = new URLSearchParams()
    searchParams.append("response_type", 'code')
    searchParams.append("client_id", process.env.REACT_APP_GITHUB_APP_CLIENT_ID || '')
    searchParams.append("scope", 'read:user,read:org')
    if (state) searchParams.append("state", `${window.location.toString()}!` + state)
    searchParams.append("redirect_uri", `${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_GITHUB_OAUTH_REDIRECT}`)
    return `https://github.com/login/oauth/authorize?${searchParams.toString()}`
  }, [formData.github, formData.nftPrice])

  const handleFreeForOwnerClick = useCallback(() => {
    targetSaveGithubOrgAuth({
      v1SaveGithubOrgAuthRequest: {
        chainId: supportedChainId2Name(chainId),
        github: formData.github,
        tokenName: formData.tokenName,
        nftPrice: formData.nftPrice,
        nftPriceDiscounted: formData.nftPriceDiscounted,
        multiplyAmount: formData.multiplyAmount?.toExact(),
        pairTokenName: formData.pairToken.symbol,
      },
    }).unwrap().then((r) => {
      window.location.href = freeForOwnerURL(r.state)
    }).catch((err) => console.log(err))
  }, [chainId, formData.github, formData.multiplyAmount, formData.nftPrice, formData.nftPriceDiscounted, formData.pairToken.symbol, formData.tokenName, freeForOwnerURL, targetSaveGithubOrgAuth])

  const [search] = useSearchParams()
  const navigator = useNavigate()
  const [targetGithubOrgAuth, { isLoading: githubOrgAuthLoading }] = useUserGithubOrgAuthMutation()

  useEffect(() => {
    if (!search.get('code') || !search.get("state") || githubOrgAuthLoading || formData.freeForOwner) return
    const code = search.get('code') || ''
    const state = search.get('state') || ''
    navigator("/create")
    targetGithubOrgAuth({
      v1GithubOrgAuthRequest: { code, state }
    }).unwrap().then((r) => {
      if (!r?.chainId) return
      const pairToken = getSelectToken(r?.pairTokenName as any)[supportedChainName2Id(r.chainId)]
      const multiplyAmount = CurrencyAmount.fromRawAmount(pairToken, parseUnits(r?.multiplyAmount || '0', pairToken.decimals).toString())
      if (!r.isOwner) {
        setFormData({
          github: r?.github,
          githubLogo: r?.githubLogo,
          githubStars: r?.githubStars,
          tokenName: r?.tokenName,
          pairToken,
          nftPrice: r?.nftPrice,
          nftPriceDiscounted: r?.nftPriceDiscounted,
          multiplyAmount,
          freeForOwnerErrorTips: t`Only the owner of an HBG project can get Create NFT for free.`
        })
      } else {
        setFormData({
          github: r?.github,
          githubLogo: r?.githubLogo,
          githubStars: r?.githubStars,
          tokenName: r?.tokenName,
          pairToken,
          nftPrice: r?.nftPrice,
          nftPriceDiscounted: r?.nftPriceDiscounted,
          multiplyAmount,
          freeForOwner: state,
        })
      }
      setGithubInputValue(r?.github)
      setDisabledFree(true)
      if (r?.multiplyAmount) {
        setMultiplyAmountInput(r.multiplyAmount)
        setMultiplyCollapse(true)
      }
    }).catch((err) => {
      console.log(err)
    })
  }, [formData.freeForOwner, githubOrgAuthLoading, navigator, search, setFormData, targetGithubOrgAuth, updateFormData])

  const nftPriceInputFooter = useMemo(() => {
    if (getTokenUnitPriceLoading) return
    // console.log(findPrice, buyNFTFindAmount?.toSignificant(6))
    const nftUSD = buyNFTFindAmount?.divide(1e18).multiply(parseUnits(findPrice.toString(), 18).toBigInt().toString()).divide(1e18).toSignificant(4)
    return <Stack direction={"row"} alignItems={"center"} spacing={"8px"} sx={{
      fontWeight: 500, fontSize: "12px", lineHeight: "18px",
    }}>
      <Box sx={{
        color: "inuse.graytext",
        textDecoration: formData.freeForOwner ? 'line-through' : 'unset',
        fontStyle: formData.freeForOwner ? 'italic' : 'normal'
      }}>{nftPriceOriginalCurrency.toSignificant(4)} {getSelectTokenName(chainId, formData.pairToken.symbol)} = {nftUSD} USD</Box>
      <LoadingButton disabled={!formData.nftPrice || !!formData.freeForOwner || disabledFree} loading={saveGithubOrgAuthLoading} disableElevation sx={{
        color: "inuse.linktext", fontWeight: 500, fontSize: "12px", lineHeight: "18px",
      }} onClick={handleFreeForOwnerClick}>
        <Trans>Free for owner</Trans>
      </LoadingButton>
    </Stack>
  }, [chainId, getTokenUnitPriceLoading, buyNFTFindAmount, findPrice, formData.freeForOwner, formData.nftPrice, formData?.pairToken?.symbol, handleFreeForOwnerClick, nftPriceOriginalCurrency, saveGithubOrgAuthLoading, disabledFree])

  const unitPairTokenPrice = useMemo(() => getTokenUnitPriceData?.unitPrice ? getFractionFromUnit(getTokenUnitPriceData.unitPrice).invert() : undefined, [getTokenUnitPriceData?.unitPrice])
  // console.log({ unitPairTokenPrice })
  const { convAToFind, convFindToA } = usePriceConv(unitPairTokenPrice)

  const [multiplyAmountInput, setMultiplyAmountInput] = useState<string>()
  const [multiplyLoading, setMultiplyLoading] = useState<boolean>(false)

  const handleMultiplyAmountChange = useCallback(async (v: string) => {
    setMultiplyAmountInput(v)
  }, [])

  useEffect(() => {
    if (!multiplyAmountInput || parseFloat(multiplyAmountInput) === 0 || multiplyAmountInput === ".") {
      updateFormData({
        multiplyOutFindAmount: undefined,
        multiplyOutOSPAmount: undefined,
        multiplyFeeAmount: undefined,
        multiplyInFindAmount: undefined,
        multiplyAmount: undefined,
        multiplyPayMaxAmount: undefined,
      })
      return
    }
    try {
      const inAmount = new Fraction(parseUnits(multiplyAmountInput, formData.pairToken.decimals).toBigInt().toString())
      const findInAmount = convAToFind(formData.pairToken, inAmount)
      // console.log(inAmount.toSignificant(6), findInAmount.asFraction.toSignificant(6), getTokenUnitPriceData?.unitPrice, unitPairTokenPrice?.numerator.toString(), unitPairTokenPrice?.denominator.toString())
      updateFormData({
        multiplyInFindAmount: findInAmount,
        multiplyAmount: CurrencyAmount.fromRawAmount(formData.pairToken, inAmount.quotient),
        multiplyPayMaxAmount: CurrencyAmount.fromRawAmount(formData.pairToken, getAmountPayMax(inAmount, selectSlippage) || 0),
      })
      setMultiplyLoading(true)
      multiplyInFindWithInit(findInAmount.quotient).then(([outFind, outOSP, fee]) => {
        updateFormData({
          multiplyOutFindAmount: outFind,
          multiplyOutOSPAmount: outOSP,
          multiplyFeeAmount: fee,
        })
      }).finally(() => {
        setMultiplyLoading(false)
      })
    } catch (error) {
      console.log(error)
    }
  }, [convAToFind, formData.pairToken, multiplyAmountInput, selectSlippage, updateFormData])

  const multiplyAmountFooter = useMemo(() => {
    if (getTokenUnitPriceLoading) return
    if (!formData.tokenName || !formData.multiplyOutFindAmount || !formData.multiplyAmount || !formData.multiplyInFindAmount || !formData.multiplyOutOSPAmount || !formData.multiplyFeeAmount) return
    if (multiplyLoading) return <ClipLoader size={18} loading color="#444A9E" />
    const outAmount = convFindToA(formData.pairToken, formData.multiplyOutFindAmount)
    // console.log(formData.multiplyOutFindAmount.asFraction.toSignificant(6), outAmount.asFraction.toSignificant(6), unitPairTokenPrice)
    const feeAmount = convFindToA(formData.pairToken, formData.multiplyFeeAmount)
    const multiple = Math.round(parseFloat(formData.multiplyOutFindAmount.toExact()) / (parseFloat(formData.multiplyInFindAmount.toExact()) || 1))
    return <Stack alignItems={"center"} sx={{
      bgcolor: "inuse.secondarytext", p: "8px 0", color: "inuse.graytext", fontWeight: 500, fontSize: "14px", lineHeight: "18px",
      borderRadius: "10px"
    }} spacing="8px" >
      <Box sx={{
        fontWeight: 500, fontSize: "14px", color: "inuse.graytext", float: "right", width: "100%", textAlign: "right"
      }}>
        {formData.multiplyAmount.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)} = {formData.multiplyOutOSPAmount.toSignificant(6)} {formData.tokenName}
      </Box>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", color: "inuse.graytext", float: "right", width: "100%", textAlign: "right"
      }}>
        <Trans>Maximum multiplier</Trans> : {multiple}x = {outAmount.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)}
      </Box>
      <Box sx={{
        fontWeight: 500, fontSize: "14px", color: "inuse.graytext", float: "right", width: "100%", textAlign: "right"
      }}>
        Fees (0.5%): {feeAmount.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)}
      </Box>
    </Stack>
  }, [chainId, getTokenUnitPriceLoading, convFindToA, formData.pairToken, formData.multiplyAmount, formData.multiplyFeeAmount, formData.multiplyInFindAmount, formData.multiplyOutFindAmount, formData.multiplyOutOSPAmount, formData.tokenName, multiplyLoading])

  const contract = useFindFactoryContract()
  const multiplyPayMaxAmount = useMemo(() => formData.multiplyPayMaxAmount || CurrencyAmount.fromRawAmount(formData.pairToken, 0), [formData.multiplyPayMaxAmount, formData.pairToken])
  const multiplyAmount = useMemo(() => formData.multiplyAmount || CurrencyAmount.fromRawAmount(formData.pairToken, 0), [formData.multiplyAmount, formData.pairToken])

  const needPayMax = useMemo(() => formData.freeForOwner ? multiplyPayMaxAmount : multiplyPayMaxAmount.currency.equals(nftPriceCurrency.currency) ? multiplyPayMaxAmount.add(nftPriceCurrency) : multiplyPayMaxAmount, [multiplyPayMaxAmount, formData.freeForOwner, nftPriceCurrency])
  const needPay = useMemo(() => formData.freeForOwner ? multiplyAmount : multiplyAmount.currency.equals(nftPriceCurrency.currency) ? multiplyAmount.add(nftPriceCurrency) : multiplyAmount, [multiplyAmount, formData.freeForOwner, nftPriceCurrency])
  const needPayOriginal = useMemo(() => payDiscounted.currency.equals(needPay.currency) ? needPay.add(payDiscounted) : needPay, [payDiscounted, needPay])

  const approval = useApprovalStateForSpender(
    needPayMax,
    contract?.address ?? undefined
  )

  const [balances, balancesLoading] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    [formData.pairToken]
  );

  const clearFormData = useCallback(() => {
    setFormData({ pairToken: DEFAULT_TOKEN[chainId] })
    setGithubInputValue("")
    setBuyNFTFindAmount(undefined)
    setMultiplyAmountInput(undefined)
    setMultiplyCollapse(false)
    setDisabledFree(false)
  }, [chainId, setFormData])

  useEffect(() => {
    clearFormData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])
  
  const [createDoneModal, setCreateDoneModal] = useState<boolean>(false)
  const [createDoneSignal, setCreateDoneSignal] = useState<CreateDoneSignal>()

  const handleCreateDoneClose = useCallback(() => {
    setCreateDoneModal(false)
    setCreateDoneSignal(undefined)
  }, [])

  const openDoneModal = useCallback((doneSignal: CreateDoneSignal) => {
    setCreateDoneSignal(doneSignal)
    setCreateDoneModal(true)
  }, [])

  const { createLoading, createContractResult, handleCreateToken } = useCreateOSP(
    chainId, formData, clearFormData, openDoneModal
  )

  const createButton = useMemo(() => {
    if (formData?.githubExistedId) {
      return <Button variant="contained" disableElevation sx={CreateButtonSX} onClick={() => navigator(`/${formData.githubExistedId}`)}>
        <Trans>Go to the HBG token</Trans>
      </Button>
    }
    if (!account) {
      return <ConnectWalletButton sx={CreateButtonSX} />
    }
    if (!formData.github || !formData.tokenName || !formData.nftPrice || getGithubRepoLoading || getTokenUnitPriceLoading) {
      // console.log([!formData.github, !formData.tokenName, !formData.nftPrice, githubOrgAuthLoading])
      return <Button variant="contained" disableElevation sx={CreateButtonSX} disabled>
        <Trans>Create</Trans>
      </Button>
    }
    // console.log(balances?.[formData.pairToken.address]?.toExact(), needPayMax.toExact())
    if (needPayMax.greaterThan(0) && (!balances || !balances[formData.pairToken.address] || balances?.[formData.pairToken.address]?.lessThan(needPayMax))) {
      return <Button variant="contained" disableElevation sx={CreateButtonSX} disabled>
        <Trans>Insufficient Balance</Trans>
      </Button>
    }
    if (needPayMax.greaterThan(0) && approval !== ApprovalState.APPROVED) {
      return <ApproveButton
        spender={contract.address}
        tokenAmount={needPayMax}
        chainId={chainId}
        sx={CreateButtonSX}
      />
    }
    return <CreateButton loading={createLoading || balancesLoading} onClick={handleCreateToken} contractResult={createContractResult}>
      <Trans>Create</Trans>
    </CreateButton>
  }, [needPayMax, account, approval, balances, balancesLoading, chainId, contract.address, createContractResult, createLoading, formData.github, formData.nftPrice, formData.pairToken.address, formData.tokenName, formData.githubExistedId, handleCreateToken, navigator, getGithubRepoLoading, getTokenUnitPriceLoading])

  const handleMultiplyCollapse = useCallback((c: boolean) => {
    setMultiplyAmountInput(undefined)
    setMultiplyCollapse(c)
  }, [])

  const navigate = useNavigate()

  const { createTutorialURL } = useLocalsInfo()

  return <Box sx={{
    mt: "80px", width: "920px", marginLeft: "auto", marginRight: "auto",
  }}>
    <Stack direction={"row"} spacing={"8px"} alignItems={"center"} sx={{
      cursor: "pointer", maxWidth: "150px"
    }} onClick={() => navigator('/')}>
      <ArrowBackIcon sx={{ fontSize: "16px" }} />
      <Box sx={{
        fontWeight: 700, fontSize: "14px", lineHeight: "18px", color: "inuse.blacktext"
      }}><Trans>Back to homepage</Trans></Box>
    </Stack>
    <Stack direction={"row"} justifyContent={"space-between"} sx={{
      mt: "24px"
    }}>
      <Stack sx={{ width: "418px", cursor: "default" }} spacing={"16px"}>
        <Stack direction={"row"} sx={{
          width: "100%", height: "208px",
          bgcolor: "inuse.blacktext", borderRadius: "10px", p: "15px"
        }}>
          <Stack spacing={"3px"} sx={{
            color: "inuse.graytext", fontSize: "12px", fontWeight: 500, width: "100px"
          }}>
            <Box><Trans>Create NFT</Trans></Box>
            <Box><Trans>example</Trans></Box>
          </Stack>
          <Box sx={{
            width: "110px", marginLeft: "auto", marginRight: "auto"
          }}>
            <img src={cNFT} alt="cnft-example" height={"178px"} />
          </Box>
          <Stack justifyContent={"flex-end"}>
            <Link href="https://opensea.io/collection/harberger-tax" target={"_blank"} underline="none">
              <Stack direction={"row"} spacing={"8px"} alignItems={"center"} sx={{
                color: "inuse.inputbg"
              }}>
                  <Box sx={{
                    fontWeight: 500, fontSize: "12px", lineHeight: "18px"
                  }}><Trans>Opensea</Trans></Box>
                  <ArrowRightIcon sx={{
                    fill: "#D6D5DA",
                    fontSize: "18px",
                    cursor: "pointer",
                    "&:hover": { fill: "#9F9F9D" }
                  }} />
              </Stack>
            </Link>
          </Stack>
        </Stack>
        <Box sx={{ color: "inuse.graytext" }}>
          <ul style={{ lineHeight: "28px", fontSize: "14px", fontWeight: 400, paddingLeft: "20px", margin: "0px" }}>
            <li>{t`Create HBG token, hard top: ${OSP_INIT_EXCHANGE}.`}</li>
            <li>{t`All ${OSP_INIT_EXCHANGE} HBG tokens are added to the Uniswap ${OSP_POOL_FEE_PERCENT} pool on a single formula and will be never withdrawn.`}</li>
            <li><Trans>Create NFT and Owner NFT are created at the same time.</Trans></li>
            <li>{t`Create NFT is owned by the creator for the cost of the HBG's GitHub star * 0.1$FIND, and Open source projects can be free, and the holder has the right to collect ${OSP_CNFT_PERCENT} LP fee permanently.`}</li>
            <li>{t`Open source projects are eligible to claim Owner NFT for free and thus have the right to ${OSP_ONFT_PERCENT} LP fee in permanently.`}</li>
          </ul>
        </Box>
        <Box sx={{
          display: "flex", direction: "row", justifyContent: "center", alignItems: "center"
        }}><VideoLink text={<Trans>How to create an HBG token?</Trans>} link={createTutorialURL} /></Box>
      </Stack>
      {githubOrgAuthLoading ? <Stack spacing={'16px'} sx={{ width: "466px", "&>.MuiSelectUnstyled-popper": { width: "466px" } }}>
        <Skeleton animation="wave" width={466} height={40} />
        <Skeleton animation="wave" width={69} height={18} />
        <Skeleton animation="wave" width={466} height={40} />
        <Skeleton animation="wave" width={69} height={18} />
        <Skeleton variant="rectangular" animation="wave" width={466} height={110} />
        <Skeleton animation="wave" width={69} height={18} />
        <Skeleton variant="rectangular" animation="wave" width={466} height={110} />
        <Skeleton animation="wave" width={466} height={18} />
      </Stack> :
        <Stack sx={{ width: "466px", "&>.MuiSelectUnstyled-popper": { width: "466px" } }}>
          <GithubInput
            value={githubInputValue}
            onChange={handleGithubInputChange}
            errorTips={formData.githubErrorTips}
          />
          <FormLabel label={<Trans>Token name</Trans>} info={<Box>
            <Trans>The token name is automatically generated, with 0x as the prefix and Github org/repo as the suffix</Trans>
          </Box>} />
          <TokenNameInput
            loading={getGithubRepoLoading}
            logo={formData?.githubLogo}
            value={formData.tokenName || ''}
            disabled={!formData.tokenName}
            existedTokenName={existedTokenName}
          />
          <FormLabel mt={"26px"} label={<Trans>Create NFT price</Trans>} info={<Box>
            <Trans>Create NFT price</Trans> = {formData?.githubStars || ''} stars * 0.1$FIND<br />
            <Trans>If the number of stars is less than 30, then calculate by 30 stars * 0.1$FIND</Trans>
          </Box>} />
          <NFTPriceInput
            chainId={chainId}
            fetching={getGithubRepoLoading || getTokenUnitPriceLoading}
            nftPrice={formData.nftPrice !== undefined ? nftPriceOriginalCurrency.toSignificant(6) : undefined}
            onChangeToken={handlePairTokenChange}
            footer={nftPriceInputFooter}
            tokenId={selectTokenID}
            strikethrough={!!formData.freeForOwner}
            disabledSelect={!formData.nftPrice}
            errTips={formData.freeForOwnerErrorTips}
          />
          <FormLabel mt={"16px"} label={<Trans>Multiply token (option)</Trans>} info={<Box>
            <Trans>Please use this feature only if you clearly understand the transaction details of multiply.</Trans>
          </Box>} collapse={multiplyCollapse} onCollapse={handleMultiplyCollapse} />
          <Collapse in={multiplyCollapse}>
            <MultiplyTokenInput
              pairTokenId={selectTokenID}
              value={multiplyAmountInput}
              onChange={handleMultiplyAmountChange}
              disabled={!formData.nftPrice}
              footer={multiplyAmountFooter}
            />
          </Collapse>
          
          {!formData.freeForOwner && payDiscounted.greaterThan(0) && <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} sx={{
            mt: "16px", width: "100%", fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: (formData.nftPrice !== undefined && !getTokenUnitPriceLoading) ? "inuse.blacktext" : "inuse.graytext"
          }}>
            <Stack direction={"row"} alignItems={"center"}>
              <Trans>Original Price:</Trans>
            </Stack>
            {!getTokenUnitPriceLoading && <Box sx={{ textDecoration: 'line-through' }}>{needPayOriginal.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)}</Box>}
          </Stack>}

          {formData.freeForOwner && <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} sx={{
            mt: "16px", width: "100%", fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: (formData.nftPrice !== undefined && !getTokenUnitPriceLoading) ? "inuse.blacktext" : "inuse.graytext"
          }}>
            <Stack direction={"row"} alignItems={"center"}>
              <Trans>Original Price:</Trans>
            </Stack>
            {!getTokenUnitPriceLoading && <Box sx={{ textDecoration: 'line-through' }}>{nftPriceOriginalCurrency.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)}</Box>}
          </Stack>}

          {!formData.freeForOwner && payDiscounted.greaterThan(0) && <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} sx={{
            mt: "16px", width: "100%", fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: (formData.nftPrice !== undefined && !getTokenUnitPriceLoading) ? "inuse.error" : "inuse.graytext"
          }}>
            <Stack direction={"row"} alignItems={"center"}>
              <Trans>NFT Discount:</Trans>
              <CommonTooltip title={<Trans>As an incentive, Create NFT are currently created with a limited time discount, based on the Ethereum gas price, but the discount will not exceed the nft price.</Trans>} placement="right">
                <InfoOutlinedIcon sx={{ ml: "8px", fontSize: "16px", color: (formData.nftPrice !== undefined && !getTokenUnitPriceLoading) ? "inuse.blacktext" : "inuse.graytext" }} />
              </CommonTooltip>
            </Stack>
            {!getTokenUnitPriceLoading && <Box>-{payDiscounted.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)}</Box>}
          </Stack>}

          <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"} sx={{
            mt: "16px", mb: "16px", width: "100%", fontWeight: 500, fontSize: "14px", lineHeight: "18px", color: (formData.nftPrice !== undefined && !getTokenUnitPriceLoading) ? "inuse.blacktext" : "inuse.graytext"
          }}>
            <Stack direction={"row"} alignItems={"center"}>
              <Trans>Total amount:</Trans>
              {selectSlippage.greaterThan(0) && <CommonTooltip title={<Trans>As the exchange rate between ${getSelectTokenName(chainId, formData.pairToken.symbol)} and $FIND can fluctuate significantly, a {parseInt(selectSlippage.numerator.toString()) / 100}% redundancy is added here.</Trans>} placement="right">
                <InfoOutlinedIcon sx={{ ml: "8px", fontSize: "16px" }} />
              </CommonTooltip>}
            </Stack>
            {!getTokenUnitPriceLoading && <Box>{needPay.toSignificant(6)} {getSelectTokenName(chainId, formData.pairToken.symbol)}</Box>}
          </Stack>

          {createButton}
        </Stack>}
      <CustomDialog open={createDoneModal} onClose={handleCreateDoneClose}>
        <CustomDialogTitle onClose={handleCreateDoneClose} />
        <Box sx={{
          display: "flex", flexDirection: "column", textAlign: "center", justifyContent: "center", p: "0 50px 50px 50px", fontSize: "14px", lineHeight: "21px", fontWeight: 500
        }}>
          <Box sx={{
            display: "flex", flexDirection: "row", textAlign: "center", justifyContent: "center"
          }}>
            <Trans>Creation completed!</Trans>
          </Box>
          <Box sx={{
            mt: "12px", fontSize: "0.875rem", color: "#1A1A1A", fontWeight: 500
          }}><Trans>And as {createDoneSignal?.token.symbol} price finder first, you'll be pleased to have more people invest in it!</Trans></Box>
          <Box sx={{
            display: "flex", flexDirection: "row", textAlign: "center", justifyContent: "center"
          }}>
            <Share
              items={ShareItems(createDoneSignal?.token.id, t`#${getOrgName(createDoneSignal?.token.name)} is a fantastic open source project, #Harberger #Token has been created to invest ${createDoneSignal?.token.symbol} now! #Opensource`)}
              sx={{
                img: { width: "24px", height: "24px" },
                button: { padding: "0" },
                mt: "1.375rem",
                display: "flex",
              }}
              spacing={3}
            />
          </Box>
          <Box sx={{ mt: "24px" }}>
            <Button sx={{ width: "318px", p: "11px 16px", fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }} onClick={() => {
              handleCreateDoneClose()
              navigate(`/${createDoneSignal?.token.id}`)
              }} variant="contained" disableElevation ><Trans>Go to</Trans>&nbsp;{createDoneSignal?.token.symbol}</Button>
          </Box>
          <Box sx={{ mt: "14px" }}>
            <Link sx={{
              color: "inuse.linktext", fontWeight: 400, fontSize: "14px", lineHeight: "28px", cursor: "pointer"
            }} target={"_blank"} underline="none" href={getOpenseaLink(chainId, createDoneSignal?.token.cnft?.id)} ><Trans>Opensea</Trans></Link>
          </Box>
        </Box>
      </CustomDialog>
    </Stack>
  </Box>
}

export default Create;