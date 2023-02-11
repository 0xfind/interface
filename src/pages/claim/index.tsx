import { t, Trans } from "@lingui/macro";
import { Box, Button, Collapse, Grid, IconButton, Link, Skeleton, Snackbar, Stack } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ArrowCircleRightOutlinedIcon, TwitterIcon } from "../../components/Icons";
import {useCallback, useEffect, useMemo, useState} from "react";
import { useNavigate, useParams } from "react-router-dom";

import ConnectWalletButton from "../../components/Button/ConnectWallet";
import { CustomInput } from "../../components/Input";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { useFindEarnContract } from "../../hooks/useContract";
import {useClaimCreateVerifyMutation, useClaimGetVerifyMutation, useClaimVerifySponsorMutation, useClaimVerifyTweetsMutation, V1VerifyStep} from "../../state/service/generatedClaimApi";
import {LoadingButton} from "@mui/lab";
import {useSignatureClaimNftMutation} from "../../state/service/generatedSignatureApi";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { currentChainId, supportedChainId2Name, SupportedChainIdName } from "../../constants/chains";
import { updateClaim } from "../../state/claim/reducer";
import useCopyToClipboard from "../../hooks/useCopyToClipboard";
import { DoneDialog } from "../../components/Dialog/Common";
import { ClaimLeftBadge, ClaimRightContent } from "../../components/Box/Claim";
import { ContentRaw, CopyText } from "../../components/Box/Common";
import useFindNFT from "../../hooks/useFindNFT";
import { VideoLink } from "../../components/Link/Common";
import { useTokenDetailQuery } from "../../graphql/find/generated";
import { useFindClient } from "../../hooks/useGraphqlClient";
import { ShareItems } from "../../constants/share";
import { getRepoName } from "../../utils";
import { useLocalsInfo } from "../../hooks/useLocales";
import { OSP_INIT_EXCHANGE, OSP_ONFT_PERCENT, OSP_POOL_FEE_PERCENT } from "../../constants";
import { getOpenseaLink } from "../../constants/link";

const getClaimStep = (step?: V1VerifyStep) => {
  switch (step) {
    case "SPONSOR":
      return 1;
    case "TWEETS":
      return 2;
    case "DISCORD_DONE":
      return 3;
    case "DONE":
      return 4;
    default:
      return 1;
  }
}

const Claim = () => {
  const { tokenId } = useParams();
  const [retweetLink, setRetweetLink] = useState("");
  const [notice, setNotice] = useState<string>();
  const navigate = useNavigate();
  const findClient = useFindClient()
  const { data } = useTokenDetailQuery({ 
    variables: { address: tokenId || '' },
    client: findClient
  });
  const token = useMemo(() => data?.token, [data?.token]);
  const { account } = useActiveWeb3React();
  const chainId = useAppSelector(state => currentChainId(state.application.chainId));
  const [step, setSteps] = useState<1 | 2 | 3 | 4 | 5>(1);
  const contract = useFindEarnContract(true);
  const { onftURI, loading: nftLoading } = useFindNFT(token?.onft?.id)
  const dispatch = useAppDispatch()
  const storageClaim = useAppSelector(state => state.claim.claimInfo[tokenId || '']);

  const [targetClaimGetVerify, { isLoading: claimGetVerifyLoading }] = useClaimGetVerifyMutation()
  const [targetClaimCreateVerify, { isLoading: claimCreateVerifyLoading }] = useClaimCreateVerifyMutation()

  useEffect(() => {
    if (storageClaim?.id) {
      targetClaimGetVerify({
        v1GetVerifyRequest: {
          verifyId: storageClaim.id,
        }
      }).unwrap().then((r) => {
        dispatch(updateClaim({
          tokenId,
          verify: r.verify
        }))
        setSteps(getClaimStep(r.verify?.step))
      }).catch((reason) => {
        dispatch(updateClaim({
          tokenId,
        }))
        setNotice(reason.data?.message)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, targetClaimGetVerify, tokenId])

  useEffect(() => {
    if (storageClaim?.claimAddress && account && storageClaim.claimAddress.toLowerCase() !== account.toLowerCase()) {
      dispatch(updateClaim({tokenId}))
      setSteps(1)
    }
  }, [account, dispatch, storageClaim?.claimAddress, tokenId])

  const [
    targetVerifySponsor,
    {isLoading: verifySponsorLoading, error: verifySponsorError}
  ] = useClaimVerifySponsorMutation()
  const [
    targetVerifyTweets,
    {isLoading: verifyTweetsLoading, error: verifyTweetsError}
  ] = useClaimVerifyTweetsMutation()

  const [verifySponsorErrText, setVerifySponsorErrText] = useState<string>()
  const [verifyTweetErrText, setVerifyTweetErrText] = useState<string>()
  const [verifyDiscordErrText, setVerifyDiscordErrText] = useState<string>()
  const [claimErrText, setClaimErrText] = useState<string>()
  const [successStepDialog, setSuccessStepDialog] = useState<boolean>(false);

  useEffect(() => {
    if (verifySponsorError) setVerifySponsorErrText(t`Verification failed, please try again later.`)
    if (verifySponsorLoading) setVerifySponsorErrText(undefined)
    if (verifyTweetsError) setVerifyTweetErrText(t`Verification failed, please try again later.`)
    if (verifyTweetsLoading) setVerifyTweetErrText(undefined)
  }, [verifySponsorError, verifySponsorLoading, verifyTweetsError, verifyTweetsLoading])

  const claimExpired = useCallback((reason) => {
    if (reason.data?.reason === "claim expired") {
      console.log('claimExpired')
      dispatch(updateClaim({ tokenId }))
      setSteps(1)
      setVerifySponsorErrText(t`Claim expired, please try again`)
    }
  }, [dispatch, tokenId])

  const onClickGo = useCallback((step: any) => {
    setRetweetLink("")
    setVerifySponsorErrText(undefined)
    setVerifyTweetErrText(undefined)
    setVerifyDiscordErrText(undefined)
    setClaimErrText(undefined)
    setSteps(step);
  },[])

  const checkSponsor = useCallback((verifyId) => {
    targetVerifySponsor({
      v1VerifySponsorRequest: {
        verifyId,
      }
    }).unwrap().then(() => {
      setSuccessStepDialog(true)
      onClickGo(2);
    }).catch(claimExpired)
  }, [claimExpired, onClickGo, targetVerifySponsor])

  const onClickVerifySponsor = useCallback(() => {
    if (!account) return
    if (!storageClaim?.id) {
      targetClaimCreateVerify({
        v1CreateVerifyRequest: {
          chainId: supportedChainId2Name(chainId),
          tokenId,
          address: account,
        }
      }).unwrap().then((r) => {
        dispatch(updateClaim({
          tokenId,
          verify: r.verify
        }))
        checkSponsor(r.verify?.id)
      })
    } else {
      checkSponsor(storageClaim?.id)
    }
  }, [account, chainId, checkSponsor, dispatch, storageClaim?.id, targetClaimCreateVerify, tokenId]);

  const onClickVerifyTweets = useCallback(() => {
    if (!retweetLink || !account) return
    if (!storageClaim?.id) {
      onClickGo(1)
      return
    }
    const retweetSplit = retweetLink.split("?")[0].split("/")
    targetVerifyTweets({
      v1VerifyTweetsRequest: {
        verifyId: storageClaim?.id,
        tweets: retweetSplit[retweetSplit.length - 1]
      }
    }).unwrap().then(() => {
      setSuccessStepDialog(true)
      onClickGo(3);
    }).catch(claimExpired)
  }, [account, onClickGo, retweetLink, storageClaim?.id, targetVerifyTweets, claimExpired]);

  const onClickVerifyDiscord = useCallback(() => {
    setVerifyDiscordErrText(undefined)
    targetClaimGetVerify({
      v1GetVerifyRequest: {
        verifyId: storageClaim?.id,
      }
    }).unwrap().then((r) => {
      if (r.verify?.step !== "DONE") {
        setVerifyDiscordErrText(t`Verification failed, please try again later.`)
      } else {
        setVerifyDiscordErrText(undefined)
        setSuccessStepDialog(true)
        onClickGo(4)
      }
    }).catch(claimExpired)
  }, [claimExpired, onClickGo, storageClaim?.id, targetClaimGetVerify])

  const [claimDoneDialog, setClaimDoneDialog] = useState<boolean>(false);
  const [claimNFTLoading, setClaimNFTLoading] = useState<boolean>(false);

  const [ targetClaimNFT, ] = useSignatureClaimNftMutation()

  const onClaimNFT = useCallback(() => {
    if (!contract || !account || !tokenId || !token?.name) return;
    setClaimNFTLoading(true)
    targetClaimNFT({
      v1ClaimNftRequest: {
        chainId: supportedChainId2Name(chainId),
        name: token?.name || "",
        tokenAddress: tokenId,
        ownerAddress: account,
        verifyId: storageClaim?.id,
      }
    }).unwrap().then((value) => {
      contract.claimOSPOwnerNFT(
        tokenId,
        account,
        value.signature || ""
      ).then((value) => {
        value.wait().then(() => {
          onClickGo(5)
          setClaimDoneDialog(true)
          dispatch(updateClaim({ tokenId }))
        }).catch(() => {
          setClaimErrText(t`Sorry, claiming fail!`)
        }).finally(() => setClaimNFTLoading(false))
      }).catch((err) => {
        setClaimErrText(t`Sorry, claiming fail!`)
        setClaimNFTLoading(false)
        claimExpired(err)
      })
    }).catch((err) => {
      setClaimErrText(t`Sorry, claiming fail!`)
      setClaimNFTLoading(false)
      claimExpired(err)
    })
  }, [account, chainId, contract, onClickGo, storageClaim?.id, targetClaimNFT, token?.name, tokenId, dispatch, claimExpired]);

  const link = useMemo(() => {
    return `${window.document.location.protocol}//${window.document.location.host}/#/${tokenId?.toLowerCase() || ""}?address=${(account || "").toLowerCase()}`;
  }, [account, tokenId]);

  const onClaimButton = useMemo(() => {
    if (!account || !contract)
      return <ConnectWalletButton variant="contained" disableElevation />;
    return (
      <LoadingButton
        variant="contained"
        disableElevation
        loading={claimNFTLoading}
        onClick={onClaimNFT}
      >
        <Trans>Claim</Trans>
      </LoadingButton>
    );
  }, [account, contract, claimNFTLoading, onClaimNFT]);

  const [expanded, setExpanded] = useState(false)

  const [, copy] = useCopyToClipboard()

  const { claimTutorialURL } = useLocalsInfo()

  return (
    <Box
      sx={{
        backgroundImage: `url('/assets/bg2.png')`,
        backgroundPosition: "right bottom",
        backgroundRepeat: "no-repeat",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={!!notice}
        onClose={() => setNotice(undefined)}
        message={notice}
      />
      <DoneDialog
        text={<Trans>Verification success</Trans>}
        open={successStepDialog}
        onClose={() => setSuccessStepDialog(false)}
        nextButton={
          <Button sx={{
            width: "318px", p: "11px 16px", fontWeight: 700
          }} onClick={() => setSuccessStepDialog(false)} variant="contained" disableElevation ><Trans>Next</Trans></Button>
        }
      />
      <DoneDialog
        text={<Trans>Claimed successfully</Trans>}
        open={claimDoneDialog}
        onClose={() => setClaimDoneDialog(false)}
        nextButton={<Button sx={{ width: "318px", p: "11px 16px", fontWeight: 700 }} onClick={() => navigate(`/${tokenId}`)} variant="contained" disableElevation ><Trans>Go to</Trans>&nbsp;{token?.symbol}</Button>}
      />
      <Box sx={{ p: "80px 0", m: "auto", width: { md: "1184px", xs: "90%", sm: "90%" } }}>
        <Box sx={{ fontSize: "2.25rem", fontWeight: "700" }}><Trans>Before claiming, please do the following</Trans></Box>
        <Box sx={{ mt: "40px", fontSize: "14px", fontWeight: 400, color: "inuse.graytext" }}>
          <ul style={{ paddingLeft: "20px" }}>
            {/* TODO: the hard top of tokens issued may vary from project to project */}
            <li>{t`Hard top: ${OSP_INIT_EXCHANGE}.`}</li>
            <li>{t`All ${OSP_INIT_EXCHANGE} HBG tokens are added to the Uniswap ${OSP_POOL_FEE_PERCENT} pool on a single formula and will be never withdrawn.`}</li>
            <li>{t`Open source projects are eligible to claim Owner NFT for free and thus have the right to ${OSP_ONFT_PERCENT} LP fee in permanently.`}</li>
          </ul>
        </Box>
        <Box sx={{
          display: "flex", direction: "row", alignItems: "center", mb: "32px", 
        }}><VideoLink link={claimTutorialURL} text={<Trans>How to claim Owner NFT?</Trans>} /></Box>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container columnSpacing={{ md: "50px" }}>
            <Grid item xs={12} md={'auto'}>
              <Stack spacing={'25px'}>
                <ClaimLeftBadge current={step} done={step >= 1} step={1} text={<Trans>Add a sponsor</Trans>} />
                <ClaimLeftBadge current={step} done={step >= 2} step={2} text={<Trans>Tweets</Trans>} />
                <ClaimLeftBadge current={step} done={step >= 3} step={3} text={<Trans>Join Discord</Trans>} />
                <ClaimLeftBadge current={step} done={step >= 4} step={4} text={<Trans>Claim NFT</Trans>} />
              </Stack>
            </Grid>
            <Grid item xs={0} md={'auto'}>
              <Box sx={{ width: "1px", bgcolor: "primary.main", height: "150%" }}/>
            </Grid>
            <ClaimRightContent
              show={step === 1}
              title={<Trans>Add a sponsor</Trans>}
              verifyDisabled={!account}
              handleVerify={onClickVerifySponsor}
              verifyLoading={verifySponsorLoading || claimGetVerifyLoading || claimCreateVerifyLoading}
              errTips={verifySponsorErrText}
            >
              <ContentRaw><Trans>I  Click the "Connect Wallet" button.</Trans></ContentRaw>
              <ContentRaw>
                <Box>
                  {account ? <Button disabled variant="contained" disableElevation>
                    <Box sx={{ fontWeight: 700, color: '#2C272D'}}>[{account.slice(0, 5)}...{account.substring(account.length - 4)}]</Box>
                  </Button> : <ConnectWalletButton variant="contained" disableElevation/>}
                </Box>
                <Box sx={{ p: "2px 9px", bgcolor: "#D6D5DA", borderRadius: "27px", fontSize: "0.75rem", fontWeight: "500", textTransform: "capitalize"}}>
                  {SupportedChainIdName[chainId].toLowerCase()}
                </Box>
              </ContentRaw>
              <ContentRaw>
                <span>
                  <Trans>II Quote the link below and add it to the Sponsor list of the GitHub Repo corresponding to the current HBG token</Trans>
                  <span style={{marginLeft: "5px"}}>(<Link sx={{ color: "inuse.linktext", cursor: "pointer" }} href={`https://${token?.name}`} target={"_bank"}><Trans>Here</Trans></Link>).</span>
                </span>
              </ContentRaw>
              <ContentRaw><CopyText text={`custom: ["${link}"]`} copy={copy} /></ContentRaw>
              <ContentRaw>
                <Stack direction={"row"} alignItems={"center"} sx={{ color: '#444A9E', cursor: 'pointer' }} onClick={() => setExpanded((old) => !old)} >
                  <Box><Trans>Detail steps</Trans></Box>
                  {!expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </Stack>
              </ContentRaw>
              <Collapse in={expanded}>
                <Box sx={{
                  p: '27px 24px', fontSize: '14px', fontWeight: 500, bgcolor: 'inuse.formbg', lineHeight: '21px'
                }}>
                  <Stack spacing={"8px"}>
                    <Box sx={{ p: "10px" }}><Trans>1. Add the file ".github/FUNDING.yml" to the default branch of the Github Repo.</Trans></Box>
                    <Box sx={{ p: "10px" }}>
                      <Trans>2. Format it as follows</Trans>
                      <br /><br />
                      <Box>&nbsp;&nbsp;custom: ["{link}"]</Box>
                    </Box>
                    <Box sx={{ p: "10px" }}><Trans>3. Once added, the link will be displayed under "Sponsor this project" on the right side of the Github Repo</Trans></Box>
                    <Box sx={{ p: "10px" }}><Trans>Example:</Trans>&nbsp;&nbsp;<a style={{ color: '#444A9E' }} href="https://github.com/0xfind/0xfind/blob/main/.github/FUNDING.yml" target={"_blank"} rel={'noreferrer'}>https://github.com/0xfind/0xfind/blob/main/.github/FUNDING.yml</a></Box>
                  </Stack>
                </Box>
              </Collapse>
              <ContentRaw><Trans>III  Click the "Verify" button.</Trans></ContentRaw>
            </ClaimRightContent>
            <ClaimRightContent
              show={step === 2}
              title={<Trans>Tweets</Trans>}
              verifyDisabled={retweetLink === ""}
              handleVerify={onClickVerifyTweets}
              verifyLoading={verifyTweetsLoading}
              errTips={verifyTweetErrText}
            >
              <ContentRaw><Trans>I Click the twitter botton and @HarbergerToken in Twitter.</Trans></ContentRaw>
              <ContentRaw>
                <IconButton 
                  sx={{ pl: '4px', pr: '4px', '&:hover': { bgcolor: "unset" } }}
                  href={ShareItems(token?.id, t`@HarbergerToken We decided to claim #${token?.symbol} officially, thank you for your appreciation and support of ${getRepoName(token?.name)}, let's create a future together! #Harberger #Opensource #Token`)[0]['link']}
                  target={"_blank"}
                >
                  <TwitterIcon sx={{ color: "#0062A3", '&:hover': { color: 'inuse.secondary' }}} />
                </IconButton>
              </ContentRaw>
              <ContentRaw><Trans>II Copy and paste the tweet link URL, and Click the "Verify" button.</Trans></ContentRaw>
              <ContentRaw>
                <Box sx={{ width: '100%' }}>
                  <CustomInput
                    onChange={(event) => setRetweetLink(event.target.value)}
                    placeholder={t`e.g.https://twitter.com/HarbergerToken/status/1234567890123456789`}
                  />
                </Box>
              </ContentRaw>
            </ClaimRightContent>
            <ClaimRightContent
              show={step === 3}
              title={<Trans>Join Discord</Trans>}
              handleVerify={onClickVerifyDiscord}
              verifyLoading={claimGetVerifyLoading}
              errTips={verifyDiscordErrText}
            >
              <ContentRaw>
                <Trans>I Click on the link &nbsp;<Link href="https://discord.gg/BYEDPc9KXT" target={"_blank"} sx={{color: "inuse.linktext"}}>https://discord.gg/BYEDPc9KXT</Link>&nbsp;and enter to Discord.</Trans>
              </ContentRaw>
              <ContentRaw>
                <span><Trans>II Copy the ID below and go to the&nbsp;<span style={{ backgroundColor: "#C9C7CE" }}>#get-verified</span>&nbsp;channel to complete the Discord verification step of the claiming Owner NFT process.</Trans></span>
              </ContentRaw>
              <ContentRaw><CopyText text={storageClaim?.id || ''} copy={copy} /></ContentRaw>
              <ContentRaw><Trans>III When finished, click "Verify" button.</Trans></ContentRaw>
            </ClaimRightContent>
            <ClaimRightContent
              show={step >= 4}
              title={<Trans>Claim NFT</Trans>}
              noVerify
            >
              <Stack direction={"row"} sx={{
                height: "426px", width: '632px',
                bgcolor: "inuse.secondarytext", borderRadius: "10px", p: "25px"
              }}>
                <Stack spacing={"3px"} sx={{
                  color: "inuse.blacktext", fontSize: "12px", fontWeight: 500, width: "100px"
                }}>
                  <Box><Trans>Owner NFT</Trans></Box>
                </Stack>
                <Box sx={{
                  width: "245px", marginLeft: "auto", marginRight: "auto"
                }}>
                  {nftLoading ? <Skeleton variant="rectangular" width={232} height={376} /> : <img src={onftURI} alt="onft" height={"100%"} /> }
                </Box>
                <Stack justifyContent={"flex-end"}>
                  <Link sx={{ fontWeight: 500, fontSize: "12px", lineHeight: "18px", color: "inuse.blacktext", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center" }} target={"_blank"} underline="none" href={getOpenseaLink(chainId, token?.onft?.id)} >
                    <Box sx={{ mr: "8px" }}><Trans>Opensea</Trans></Box>
                    <ArrowCircleRightOutlinedIcon sx={{ fontSize: "18px" }} />
                  </Link>
                </Stack>
              </Stack>
              <ContentRaw><Trans>I  Click "Claim" button, finish the last step.</Trans></ContentRaw>
              <Stack direction={"row"} sx={{ mt: "18px" }} alignItems={"center"} spacing={"18px"}>
                {onClaimButton}
                {!!claimErrText && <Box sx={{ fontSize: "14px", color: "inuse.error" }}>
                  {claimErrText}
                </Box>}
              </Stack>
            </ClaimRightContent>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Claim;
