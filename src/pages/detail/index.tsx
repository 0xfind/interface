import { useParams } from "react-router-dom";

import {currentChainId, supportedChainId2Name} from "../../constants/chains";
import { useDetailToken } from "../../hooks/useTokens";

import { t, Trans } from "@lingui/macro";
import { LoadingButton } from "@mui/lab";
import { Box, Button, Grid, Link, Skeleton, Stack } from "@mui/material";
import { useCallback, useMemo, useState, useEffect, ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import Share from "../../components/Share";
import { ShareItems } from "../../constants/share";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { useFindEarnContract } from "../../hooks/useContract";
import { TokenClaimStatus } from "../../hooks/useTokens";
import { formatNumber, formatPriceChange, formatTimeStampLocalized, getOrgName } from "../../utils";
import { WETH } from "../../constants/token";
import { FINDCoinIcon, EyeIcon, LongArrowDownIcon, LongArrowUpIcon, PencilIcon, PrIcon, StarIcon, ArrowCircleRightOutlinedIcon } from "../../components/Icons";
import { useUserGetGithubRepoInfoMutation } from "../../state/service/generatedUserApi";
import ConnectWalletButton from "../../components/Button/ConnectWallet";
import { DetailDialog, CustomDialogTitle } from "../../components/Dialog";
import { DataCard } from "../../components/Card";
import { useAppSelector } from "../../state/hooks";
import editDescImg2 from "./assets/image2.png";
import editDescImg1 from "./assets/image1.png";
import { FormLabel } from "../../components/Form/Common";
import { NumberInput } from "../../components/Input/Common";
import useFindNFT from "../../hooks/useFindNFT";
import { CollectFeeHistoryDialog, History } from "../../components/Dialog/History";
import { CommonTooltip } from "../../components/Tooltip/Common";
import { AddressCopyText } from "../../components/Box/Common";
import useCopyToClipboard from "../../hooks/useCopyToClipboard";
import CurrencyText from "../../components/Box/Currency";
import { SupportedCurrency } from "../../constants/currency";
import useCurrency from "../../hooks/useCurrency";
import { useFindClient } from "../../hooks/useGraphqlClient";
import { useCollectFeeHistoriesLazyQuery, useTokenDetailQuery } from "../../graphql/find/generated";
import { getOpenseaLink, getPoolInfoLink, getScanLink, getSwapLink, SCANNAME } from "../../constants/link";
import { OSP_CNFT_PERCENT, OSP_INIT_EXCHANGE, OSP_ONFT_PERCENT, OSP_POOL_FEE_PERCENT } from "../../constants";
import { Status404 } from "../../components/Box/Status";
import { ScaleLoader } from "react-spinners";

const findBadge = (symbol?: string, github?: string, logo?: ReactElement) => (<Button variant="contained" disableElevation sx={{
  borderRadius: "16px",
  boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
  bgcolor: "inuse.text",
  color: "inuse.blacktext",
  fontSize: "14px",
  lineHeight: "18px",
  fontWeight: 500,
  p: "7.2px 10px",
  "&:hover": {
    bgcolor: "inuse.text",
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
    color: "inuse.blacktext",
  },
  "&:disabled": {
    bgcolor: "inuse.text",
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
    color: "inuse.blacktext",
  }
}}>
  <Box sx={{
    display: "flex", flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  }}>
    <Box sx={{
      display: "flex", flexDirection: "row", alignItems: "center",
    }}>
      {logo || <FINDCoinIcon sx={{ fontSize: "24px", mr: "12px" }} />}
      <CommonTooltip title={github ? <Box>
        {symbol} <Box sx={{ color: "inuse.graytext" }}>{github?.replace("https://", "")}</Box>
      </Box> : ''} placement="top">
        <Box sx={{
          maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{symbol || 'FIND'}</Box>
      </CommonTooltip>
    </Box>
  </Box>
</Button>)


const currencyDom = (position: string, symbol: string, currency: string, currencyUnit: string, isSmall: boolean, fontSize: string) => {
  return <>
    {isSmall && <Box>&lt;</Box>}
    {position === "prefix" && <Box>{symbol}&nbsp;</Box>}
    <Box sx={{ fontSize }}>{isSmall ? '0.01' : currency + currencyUnit}</Box>
    {position === "postfix" && <Box>&nbsp;{symbol}</Box>}
  </>
}

const Detail = () => {
  const { tokenId } = useParams()
  const { account } = useActiveWeb3React()
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId))
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const { datum: tokenInfo, isLoading: tokenLoading } = useDetailToken(tokenId || "", chainId)
  const findClient = useFindClient()
  const { data: tokenDetail, loading: tokenDetailLoading } = useTokenDetailQuery({
    variables: { address: tokenId || '', },
    client: findClient,
  })
  const navigate = useNavigate();

  const {
    symbol: priceSymbol, symbolPosition: priceSymbolPosition, currency: priceCurrency, currencyUnit: priceCurrencyUnit, isSmall: priceIsSmall
  } = useCurrency({ base: SupportedCurrency.USD, value: tokenInfo?.priceUSD || 0, average: false })

  const {
    symbol: ownerNFTSymbol, symbolPosition: ownerNFTSymbolPosition, currency: ownerNFTCurrency, isSmall: ownerNFTIsSmall, currencyUnit: ownerNFTCurrencyUnit
  } = useCurrency({ base: SupportedCurrency.USD, value: tokenInfo?.ownerNFTIncomeUSD || 0 })

  const {
    symbol: createNFTSymbol, symbolPosition: createNFTSymbolPosition, currency: createNFTCurrency, isSmall: createNFTIsSmall, currencyUnit: createNFTCurrencyUnit
  } = useCurrency({ base: SupportedCurrency.FIND, value: tokenInfo?.createNFTIncomeFind || 0 })

  const onClickClaim = useCallback((id: string) => navigate(`/${id}/claim`), [navigate])

  const contract = useFindEarnContract(true)

  const [collectButtonLoading, setCollectButtonLoading] = useState<Record<string, boolean>>({})
  const [collectCreateNFTButtonLoading, setCollectCreateNFTButtonLoading] = useState<Record<string, boolean>>({})

  const onClickCollectOwnerNFT = useCallback((id: string) => {
      if (!selectedWallet || !contract) return;
      setCollectButtonLoading((old) => ({ ...old, [id]: true }));
      contract.collectOspUniswapLPFee(id)
        .then((value) => {
          value
            .wait()
            // .then(() => {})
            .catch((reason) => {
              console.log(reason.data?.message || reason.message);
            })
            .finally(() =>
              setCollectButtonLoading((old) => ({ ...old, [id]: false }))
            );
        })
        .catch((reason: any) => {
          setCollectButtonLoading((old) => ({ ...old, [id]: false }));
        });
  }, [selectedWallet, contract])

  const onClickCollectCreateNFT = useCallback((id: string) => {
    if (!selectedWallet || !contract) return
    setCollectCreateNFTButtonLoading((old) => ({ ...old, [id]: true }));
    contract.collectOspUniswapLPFee(id)
      .then((value) => {
        value
          .wait()
          // .then(() => {})
          .catch((reason) => {
            console.log(reason.data?.message || reason.message);
          })
          .finally(() =>
            setCollectCreateNFTButtonLoading((old) => ({ ...old, [id]: false }))
          );
      })
      .catch((reason: any) => {
        setCollectCreateNFTButtonLoading((old) => ({ ...old, [id]: false }));
      });
  }, [selectedWallet, contract])

  const collectCreateNFTButton = useMemo(() => {
    if (!tokenInfo) return;
    const sx = { width: "100%", p: '11px 16px', fontWeight: 700 }
    if (!selectedWallet) return <ConnectWalletButton sx={sx} text={<Trans>Connect</Trans>} />;
    return (
      <LoadingButton
        variant="contained"
        disableElevation
        loading={collectCreateNFTButtonLoading[tokenInfo.id] || false}
        onClick={() => onClickCollectCreateNFT(tokenInfo.id)}
        disabled={tokenInfo.createNFTOwner.toLowerCase() !== account?.toLowerCase()}
        sx={sx}
      >
        <Trans>Collect</Trans>
      </LoadingButton>
    );
  }, [account, selectedWallet, collectCreateNFTButtonLoading, onClickCollectCreateNFT, tokenInfo])

  const claimOwnerNFTORCollectButton = useMemo(() => {
    if (!tokenInfo) return
    const sx = { width: "100%", p: '11px 16px', fontWeight: 700 };
    if (tokenInfo.claimStatus === TokenClaimStatus.CLAIMED) {
      if (!selectedWallet) return <ConnectWalletButton sx={sx} text={<Trans>Connect</Trans>} />;
      return (
        <LoadingButton
          variant="contained"
          disableElevation
          loading={collectButtonLoading[tokenInfo.id] || false}
          onClick={() => onClickCollectOwnerNFT(tokenInfo.id)}
          disabled={tokenInfo.ownerNFTOwner.toLowerCase() !== account?.toLowerCase()}
          sx={sx}
        >
          <Trans>Collect</Trans>
        </LoadingButton>
      );
    }
    return (
      <LoadingButton
        variant="contained"
        disableElevation
        onClick={() => onClickClaim(tokenInfo.id)}
        sx={sx}
      >
        <Trans>Claim</Trans>
      </LoadingButton>
    );
  }, [
    account,
    selectedWallet,
    collectButtonLoading,
    onClickClaim,
    onClickCollectOwnerNFT,
    tokenInfo,
  ]);

  const [targetGetGithubRepoInfo, { isLoading: githubInfoLoading, data: githubInfo }] = useUserGetGithubRepoInfoMutation()

  useEffect(() => {
    if (tokenInfo?.github) {
      targetGetGithubRepoInfo({
        v1GetGithubRepoInfoRequest: {
          owner: tokenInfo?.github?.replace("https://", "").split("/")[1],
          repo: tokenInfo?.github?.replace("https://", "").split("/")[2],
          chainId: supportedChainId2Name(chainId)
        }
      })
    }
  }, [chainId, targetGetGithubRepoInfo, tokenInfo?.github])

  const {onftURI, cnftURI, loading: nftLoading} = useFindNFT(tokenInfo?.ownerNFTId, tokenInfo?.createNFTId)

  const [editDialog, setEditDialog] = useState(false);
  const [oNFTDialog, setONFTDialog] = useState(false);
  const [oNFTHistoryDialog, setONFTHistoryDialog] = useState(false);
  const [cNFTDialog, setCNFTDialog] = useState(false);
  const [cNFTHistoryDialog, setCNFTHistoryDialog] = useState(false);
  
  const [, copy] = useCopyToClipboard()

  const [targetCollectHistories, {
    data: collectHistoriesData,
    loading: collectHistoriesLoading,
  }] = useCollectFeeHistoriesLazyQuery({ client: findClient })

  const [cnftHistories, onftHistories]: [History[], History[]] = useMemo(() => {
    if (!collectHistoriesData?.collectOspUniswapLPFeeHistories) return [[], []]
    return collectHistoriesData.collectOspUniswapLPFeeHistories.reduce((acc: [History[], History[]], his: any) => {
      acc[0].push({
        text: `${t`Collected`} ${formatNumber(parseFloat(his.cTokenAmount))} FIND on ${formatTimeStampLocalized(his.timestamp)}`,
        link: getScanLink(chainId, his.id),
        timestamps: his.timestamp,
      })
      acc[1].push({
        text: `${t`Collected`} ${formatNumber(parseFloat(his.oTokenAmount))} ${tokenInfo?.symbol} on ${formatTimeStampLocalized(his.timestamp)}`,
        link: getScanLink(chainId, his.id),
        timestamps: his.timestamp,
      })
      return acc
    }, [[], []])
  }, [chainId, collectHistoriesData?.collectOspUniswapLPFeeHistories, tokenInfo?.symbol])

  const openCnftHistory = useCallback(() => {
    targetCollectHistories({
      variables: { cnftId: tokenInfo?.createNFTId || "0" },
    }).then(() => {
      setCNFTDialog(false)
      setCNFTHistoryDialog(true)
    })
  }, [targetCollectHistories, tokenInfo?.createNFTId])

  const openOnftHistory = useCallback(() => {
    targetCollectHistories({
      variables: { cnftId: tokenInfo?.createNFTId || "0" },
    }).then(() => {
      setONFTDialog(false)
      setONFTHistoryDialog(true)
    })
  }, [targetCollectHistories, tokenInfo?.createNFTId])

  if (!tokenDetailLoading && !tokenDetail?.token) return <Status404 />

  return (
    <Box
      sx={{
        backgroundImage: `url('assets/bg2.png')`,
        backgroundPosition: "right bottom",
        backgroundRepeat: "no-repeat",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <CollectFeeHistoryDialog 
        open={oNFTHistoryDialog}
        onClose={() => setONFTHistoryDialog(false)}
        histories={onftHistories}
      />
      <CollectFeeHistoryDialog
        open={cNFTHistoryDialog}
        onClose={() => setCNFTHistoryDialog(false)}
        histories={cnftHistories}
      />
      <DetailDialog open={editDialog} onClose={() => setEditDialog(false)}>
        <CustomDialogTitle onClose={() => setEditDialog(false)}>
          <Trans>Edit</Trans>
        </CustomDialogTitle>
        <Box sx={{
          p: '0 50px 40px 50px'
        }}>
          <Stack spacing={'8px'} sx={{
            fontSize: '14px', lineHeight: '17px', fontWeight: 500
          }}>
            <Box>
              <Trans>I You can edit the README file and change the text here.</Trans>
            </Box>
            <Box>
              <Link sx={{ color: "inuse.linktext", cursor: "pointer" }} underline="hover" href={tokenInfo?.github} target="_blank">
                {tokenInfo?.github}
              </Link>
            </Box>
            <Box>
              <img src={editDescImg1} alt="editDescImg1" />
            </Box>
            <Box>
              <Trans>II Enter text in the description, and text with [ ] express as title.</Trans>
            </Box>
            <Box>
              <img src={editDescImg2} alt="editDescImg2" />
            </Box>
          </Stack>
          <Button sx={{ width: "100%", mt: '24px' }} href={tokenInfo?.github} variant="contained" disableElevation onClick={() => setEditDialog(false)}>
            <Trans>Go</Trans>
          </Button>
        </Box>
      </DetailDialog>
      <DetailDialog open={oNFTDialog} onClose={() => setONFTDialog(false)} width={'680px'}>
        <CustomDialogTitle onClose={() => setONFTDialog(false)}><Trans>Owner NFT</Trans></CustomDialogTitle>
        <Box sx={{
          p: '0 40px 28px 40px'
        }}>
          <Stack direction={'row'} spacing={'50px'}>
            <Stack spacing={"8px"}>
              <Box sx={{
                height: "400px",
                width: "232px"
              }}>
                {nftLoading ? <Skeleton variant="rectangular" width={232} height={400} /> : <img width={'232px'} height={'400px'} src={onftURI} alt="onft" />}
              </Box>
              <Link sx={{ color: "inuse.blacktext", display: "flex", verticalAlign: "center", flexDirection: "row", alignItems: "center", fontWeight: 500, cursor: "pointer" }} target={"_blank"} underline="none" href={getOpenseaLink(chainId, tokenInfo?.ownerNFTId)}>
                <Box sx={{ mr: "8px" }}><Trans>Opensea</Trans></Box>
                <ArrowCircleRightOutlinedIcon />
              </Link>
            </Stack>
            <Stack sx={{ width: '100%' }} spacing={'10px'}>
              <Stack>
                <FormLabel label={<Trans>Collectable income</Trans>} info={<>{t`Owner NFT holder collectable ${OSP_ONFT_PERCENT} LP fees`}</>} />
                <NumberInput
                  value={tokenInfo?.ownerNFTIncomeOSP.toFixed(2)}
                  actionButton={claimOwnerNFTORCollectButton}
                  disabledInput
                  selectDom={findBadge(tokenInfo?.symbol, tokenInfo?.github, <img
                    style={{
                      borderRadius: "10px",
                      marginRight: "12px"
                    }}
                    src={tokenInfo?.logo}
                    alt=""
                    width={24}
                    height={24}
                  />)}
                  footer={<Box sx={{
                    fontSize: '12px', lineHeight: '18px', fontWeight: 500, color: 'inuse.graytext'
                  }}>≈ <CurrencyText base={SupportedCurrency.USD}>{tokenInfo?.ownerNFTIncomeUSD}</CurrencyText></Box>}
                />
              </Stack>
              <Stack direction={"row"} justifyContent={"center"}>
                <LoadingButton onClick={openOnftHistory} loading={collectHistoriesLoading} sx={{ color: "inuse.linktext", fontSize: "12px" }} disableElevation>
                  <Trans>History List</Trans>{` ( ${formatNumber(tokenInfo?.ownerNFTCollectedOSP)} )`}
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </DetailDialog>
      <DetailDialog open={cNFTDialog} onClose={() => setCNFTDialog(false)} width={'680px'}>
        <CustomDialogTitle onClose={() => setCNFTDialog(false)}><Trans>Create NFT</Trans></CustomDialogTitle>
        <Box sx={{
          p: '0 40px 28px 40px'
        }}>
          <Stack direction={'row'} spacing={'50px'}>
            <Stack spacing={"8px"}>
              <Box sx={{
                height: "400px",
                width: "232px"
              }}>
                {nftLoading ? <Skeleton variant="rectangular" width={232} height={400} /> : <img width={'232px'} height={'400px'} src={cnftURI} alt="cnft" />}
              </Box>
              <Link sx={{ color: "inuse.blacktext", display: "flex", verticalAlign: "center", flexDirection: "row", alignItems: "center", fontWeight: 500, cursor: "pointer" }} target={"_blank"} underline="none" href={getOpenseaLink(chainId, tokenInfo?.createNFTId)} >
                <Box sx={{ mr: "8px" }}><Trans>Opensea</Trans></Box>
                <ArrowCircleRightOutlinedIcon />
              </Link>
            </Stack>
            <Stack sx={{ width: '100%' }} spacing={'10px'}>
              <Stack>
                <FormLabel label={<Trans>Collectable income</Trans>} info={<>t`Create NFT holder collectable ${OSP_CNFT_PERCENT} LP fees`</>} />
                <NumberInput
                  value={tokenInfo?.createNFTIncomeFind.toFixed(2)}
                  selectDom={findBadge()}
                  actionButton={collectCreateNFTButton}
                  disabledInput
                  footer={<Box sx={{
                    fontSize: '12px', lineHeight: '18px', fontWeight: 500, color: 'inuse.graytext'
                  }}>≈ <CurrencyText>{tokenInfo?.createNFTIncomeFind}</CurrencyText></Box>}
                />
              </Stack>
              <Stack direction={"row"} justifyContent={"center"}>
                <LoadingButton onClick={openCnftHistory} loading={collectHistoriesLoading} sx={{ color: "inuse.linktext", fontSize: "12px" }} disableElevation>
                  <Trans>History List</Trans>{` ( ${formatNumber(tokenInfo?.createNFTCollectedFind)} )`}
                </LoadingButton>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </DetailDialog>
      <Box
        sx={{
          p: "80px 0",
          width: {
            xs: "90%",
            md: "984px",
            sm: "90%",
          },
          m: "auto",
          zIndex: 1,
          position: "relative",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={{ xs: 2, sm: 2, md: 12 }}>
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box>
                  {(githubInfoLoading || !githubInfo?.logo) ? <Skeleton animation="wave" variant="circular" width={45} height={45} /> : <CommonTooltip 
                    title={<Box>{tokenInfo?.name} <Box sx={{ color: "inuse.graytext" }}>{tokenInfo?.github.replace("https://", "")}</Box></Box>} 
                    placement="top">
                      <img
                        style={{ borderRadius: "10px" }}
                        src={githubInfo?.logo || ""}
                        alt=""
                        height={45}
                        width={45}
                      />
                  </CommonTooltip>}
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", ml: "14px",}}>
                  <Stack sx={{ fontWeight: 700 }} direction="row" alignItems={"center"} justifyContent={"flex-start"} spacing={"14px"}>
                    {(githubInfoLoading || !githubInfo) ? <Skeleton variant="text" height="24px" width="70px" /> : <Link underline={"none"} color={'black'} href={tokenInfo?.github} target={"_blank"} rel={"noreferrer"} sx={{
                      "&:hover": { color: "inuse.linktext" }
                    }}>{tokenInfo?.name}</Link>}
                    <AddressCopyText text={tokenId || ''} content={`${tokenId?.substring(0, 6)}...${tokenId?.slice(-4)}`} copy={copy} />
                  </Stack>
                  {(githubInfoLoading || !githubInfo) ? <Skeleton variant="text" /> : <Stack
                    direction={"row"}
                    spacing={1}
                    sx={{
                      display: "flex",
                      color: "#9F9F9D",
                      alignItems: "center",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    <Box sx={{ display: "flex" }}>
                      <StarIcon
                        sx={{
                          width: 16,
                          height: 16,
                          mt: "2px",
                        }}
                      />
                      &nbsp;{formatNumber(parseInt(githubInfo?.stars || "0"), 0)} star
                    </Box>
                    <Box sx={{ display: "flex" }}>
                      <EyeIcon
                        sx={{
                          width: 16,
                          height: 16,
                          mt: "2px",
                        }}
                      />
                      &nbsp;{formatNumber(parseInt(githubInfo?.watchers || "0"), 0)} watching
                    </Box>
                    <Box sx={{ display: "flex" }}>
                      <PrIcon
                        sx={{
                          width: 16,
                          height: 16,
                          mt: "2px",
                        }}
                      />
                      &nbsp;{formatNumber(parseInt(githubInfo?.forks || "0"), 0)} forks
                    </Box>
                  </Stack>}
                </Box>
              </Box>
              {(githubInfoLoading || !githubInfo) ? <Skeleton variant="rectangular" sx={{ mt: '50px' }} height={150} /> :  <>
                <Box sx={{ mt: "50px", fontWeight: 700, fontSize: "2rem" }}>
                  {githubInfo?.title || (
                    <Trans>You can invest in the Harbeger token of this project!</Trans>
                  )}
                </Box>
                <Box sx={{ fontWeight: 400, fontSize: "14px", color: "inuse.graytext", mt: "16px", lineHeight: '24px' }}>
                  {githubInfo?.desc || ""}
                </Box>
                {tokenInfo?.claimStatus === TokenClaimStatus.CLAIMED && <PencilIcon
                  onClick={() => setEditDialog(true)}
                  sx={{ fontSize: "14px", color: 'inuse.graytext', '&:hover': {color: 'inuse.blacktext'}, cursor: 'pointer', mt: '3px' }}
                />}
              </>}
              <Share
                items={ShareItems(tokenInfo?.id, t`#${getOrgName(tokenInfo?.token.name)} is a fantastic open source project, #Harberger #Token has been created to invest ${tokenInfo?.token.symbol} now! #Opensource`)}
                sx={{
                  img: { width: "24px", height: "24px" },
                  button: { padding: "0" },
                  mt: "1.375rem",
                  display: "flex",
                }}
                spacing={1}
              />
              <Box
                sx={{
                  mt: "50px",
                }}
              >
                <Box
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    color: "#999BA1",
                  }}
                >
                  <Trans>Price</Trans>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Stack alignItems={"baseline"} direction={"row"} sx={{ fontWeight: 500, fontSize: "1.5rem" }}>
                    {tokenLoading ? <Box sx={{ mt: "12px", mb: "12px" }}><ScaleLoader height="44" /></Box> : <>
                      {currencyDom(priceSymbolPosition, priceSymbol, priceCurrency, priceCurrencyUnit, priceIsSmall, "3rem")}
                      <Stack direction={"row"} spacing={"3px"} alignItems={"center"} sx={{
                        fontSize: "1rem", ml: "16px"
                      }}>
                        <Box sx={{ fontSize: "1rem" }}>(</Box>
                        {(tokenInfo?.priceChange && tokenInfo?.priceChange < 0) ? <LongArrowDownIcon sx={{ width: "8px", height: "13px" }} /> : <LongArrowUpIcon sx={{ width: "8px", height: "13px" }} />}
                        <Box sx={{
                          color: `${(tokenInfo?.priceChange && tokenInfo?.priceChange < 0)
                            ? "inuse.error"
                            : "inuse.primary"
                            }`,
                        }}>{formatPriceChange(Math.abs(tokenInfo?.priceChange || 0))}</Box>
                        <Box sx={{ fontSize: "1rem" }}>)</Box>
                      </Stack>
                    </>}
                  </Stack>
                  <Stack direction={'row'} alignItems={'center'} spacing={"8px"}>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/assets?action=multiply&token=${tokenInfo?.id}`)}
                      disableElevation
                      sx={{ width: "83px", bgcolor: 'inuse.secondary', color: 'inuse.blacktext', '&:hover': { bgcolor: '#E6D277' } }}
                    >
                      <Trans>Multiply</Trans>
                    </Button>
                    <Button
                      variant="contained"
                      target={"_blank"}
                      href={getSwapLink(chainId, WETH[chainId].address, tokenInfo?.id)}
                      disableElevation
                    >
                      <Trans>Buy</Trans>
                    </Button>
                  </Stack>
                </Box>
                <Box
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    color: "#999BA1",
                  }}
                >
                  <Trans>Owner NFT</Trans>
                </Box>
                <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
                  <Stack direction={"row"} sx={{ fontWeight: 500, fontSize: "1.125rem" }} alignItems={"baseline"} >
                    {tokenLoading ? <Box sx={{ mt: "8px", mb: "8px" }}><ScaleLoader height="32" /></Box> : <>
                      {currencyDom(ownerNFTSymbolPosition, ownerNFTSymbol, ownerNFTCurrency, ownerNFTCurrencyUnit, ownerNFTIsSmall, "2.25rem")}
                    </>}
                  </Stack>
                  <Box>
                    <Button disableElevation onClick={() => setONFTDialog(true)} sx={{ color: "inuse.linktext" }}>
                      {tokenInfo?.claimStatus === TokenClaimStatus.CLAIMED ? <Trans>Collect</Trans> : <Trans>Claim</Trans>}
                    </Button>
                  </Box>
                </Stack>
                <Box
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    color: "#999BA1",
                  }}
                >
                  <Trans>Create NFT</Trans>
                </Box>
                <Stack direction={"row"} alignItems={"center"} justifyContent={"space-between"}>
                  <Stack direction={"row"} sx={{ fontWeight: 500, fontSize: "1.125rem" }} alignItems={"baseline"}>
                    {tokenLoading ? <Box sx={{ mt: "8px", mb: "8px" }}><ScaleLoader height="32" /></Box> : <>
                      {currencyDom(createNFTSymbolPosition, createNFTSymbol, createNFTCurrency, createNFTCurrencyUnit, createNFTIsSmall, "2.25rem")}
                    </>}
                  </Stack>
                  <Box>
                    <Button disableElevation onClick={() => setCNFTDialog(true)} sx={{ color: "inuse.linktext" }}><Trans>Collect</Trans></Button>
                  </Box>
                </Stack>
              </Box>
              <Box
                sx={{
                  p: "41px 41px 51px 41px",
                  borderRadius: "20px",
                  bgcolor: "#2C272D",
                  mt: "27px",
                  color: "#D6D5DA",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Box sx={{ color: "#999BA1", fontWeight: 400 }}>
                      <Trans>TVL</Trans>
                    </Box>
                    <Box sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
                      <CurrencyText>{tokenInfo?.tvlFind}</CurrencyText>
                    </Box>
                    <Box
                      sx={{
                        color: `${(tokenInfo?.tvlFindChange && tokenInfo?.tvlFindChange < 0)
                          ? "inuse.error"
                          : "inuse.primary"
                          }`,
                      }}
                    >
                      {formatPriceChange(tokenInfo?.tvlFindChange || 0)}
                    </Box>
                  </Box>
                  <Box sx={{ width: "183px" }}>
                    <Box sx={{ color: "#999BA1", fontWeight: 400 }}>
                      <Trans>24h Trading Vol</Trans>
                    </Box>
                    <Box sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
                      <CurrencyText base={SupportedCurrency.USD}>{tokenInfo?.volumeUSD}</CurrencyText>
                    </Box>
                    <Box
                      sx={{
                        color: `${(tokenInfo?.volumeUSDChange && tokenInfo?.volumeUSDChange < 0)
                          ? "inuse.error"
                          : "inuse.primary"
                          }`,
                      }}
                    >
                      {formatPriceChange(tokenInfo?.volumeUSDChange || 0)}
                    </Box>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: "24px",
                    mb: "31px",
                  }}
                >
                  <Box>
                    <Box sx={{ color: "#999BA1", fontWeight: 400 }}>
                      <Trans>24h Fees</Trans>
                    </Box>
                    <Box sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
                      <CurrencyText base={SupportedCurrency.USD}>{tokenInfo?.feesUSD}</CurrencyText>
                    </Box>
                  </Box>
                  <Box sx={{ width: "183px" }}>
                    <Box sx={{ color: "#999BA1", fontWeight: 400 }}>
                      <Trans>7d Trading Vol</Trans>
                    </Box>
                    <Box sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
                      <CurrencyText base={SupportedCurrency.USD}>{tokenInfo?.volumeUSDWeek}</CurrencyText>
                    </Box>
                  </Box>
                </Box>
                <Box
                  onClick={() => window.open(getPoolInfoLink(chainId, tokenInfo?.poolAddress), "_blank")}
                  sx={{
                    float: "right",
                    verticalAlign: "center",
                    lineHeight: "24px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  <Box>
                    <Trans>Uniswap</Trans>
                  </Box>
                  <Box
                    sx={{
                      height: "16px",
                      ml: "8px",
                    }}
                  >
                    <ArrowCircleRightOutlinedIcon
                      sx={{ width: "18px", height: "18px" }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  width: "245px",
                  height: "400px",
                  ml: "auto",
                  mr: "auto",
                }}
              >
                <DataCard
                  bees={tokenInfo?.claimStatus === TokenClaimStatus.CLAIMED}
                  valueB={tokenDetail?.finderStat?.finderCount || 0}
                  nameA={<Trans>TVL</Trans>}
                  valueA={tokenInfo?.tvlFind || 0}
                  currencyA={SupportedCurrency.FIND}
                  nameB={<Trans>Finder</Trans>}
                  sx={{ textAlign: 'center', position: "relative", top: tokenInfo?.claimStatus === TokenClaimStatus.CLAIMED ? "0" : "55px" }}
                />
              </Box>
              <Box
                sx={{
                  fontWeight: 400,
                  fontSize: "0.875rem",
                  lineHeight: "28px",
                  color: "#9F9F9D",
                }}
              >
                <ul
                  style={{
                    paddingLeft: "20px",
                  }}
                >
                  <li>{t`Hard top: ${OSP_INIT_EXCHANGE}.`}</li>
                  <li>{t`All ${OSP_INIT_EXCHANGE} HBG tokens are added to the Uniswap ${OSP_POOL_FEE_PERCENT} pool on a single formula and will be never withdrawn.`}</li>
                  <li><Trans>Create NFT and Owner NFT are created at the same time.</Trans></li>
                  <li>{t`Create NFT is owned by the creator for the cost of the HBG's GitHub star * 0.1$FIND, and Open source projects can be free, and the holder has the right to collect ${OSP_CNFT_PERCENT} LP fee permanently.`}</li>
                  <li>{t`Open source projects are eligible to claim Owner NFT for free and thus have the right to ${OSP_ONFT_PERCENT} LP fee in permanently.`}</li>
                </ul>
              </Box>
              <Box sx={{ width: "100%", textAlign: "center" }}>
                <Link
                  target={"_blank"}
                  href={getScanLink(chainId, tokenInfo?.id || "", 'token')}
                  sx={{
                    color: "inuse.linktext",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {SCANNAME[chainId]}
                </Link>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Detail;
