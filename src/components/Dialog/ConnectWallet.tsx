import { Trans } from "@lingui/macro";
import { Box, Button, DialogContent, IconButton, Stack } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { Connector } from "@web3-react/types";
import { CustomDialog, CustomDialogTitle } from ".";
import { getConnection, getConnectionIcon, getConnectionName, getIsMetaMask } from "../../connectors/utils";
import { coinbaseWalletConnection, injectedConnection, walletConnectConnection } from "../../connectors";
import { setWalletOpenModal } from "../../state/application/reducer";
import { updateSelectedWallet } from "../../state/user/reducer";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { WalletChoice } from "../Box/Common";
import SwipeableViews from "react-swipeable-views";
import { ArrowLeftIcon, NetworkChangeIcon } from "../Icons";
import { ALL_SUPPORTED_CHAIN_IDS, DEFAULT_CHAINID, SupportedChainId } from "../../constants/chains";
import useSelectChain from "../../hooks/useSelectChain";
import { LoadingButton } from "@mui/lab";

const ConnectWalletDialog = () => {
  const open = useAppSelector((state) => state.application.openWalletModal || false)
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  const [connectedWalletStep, setConnectedWalletStep] = useState(0)

  const isMetaMask = getIsMetaMask()
  const dispatch = useAppDispatch()
  const { account, connector, chainId } = useActiveWeb3React()

  const networkModal = useMemo(() => !!account && !ALL_SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId), [account, chainId])
  const [networkLoading, setNetworkLoading] = useState<boolean>(false)

  const onClose = useCallback(() => {
    setConnectedWalletStep(0)
    dispatch(setWalletOpenModal(false))
   }, [dispatch]);
  const handleConnectWallet = useCallback(
    async (connector: Connector) => {
      const connectionType = getConnection(connector).type

      try {
        // Fortmatic opens it's own modal on activation to log in. This modal has a tabIndex
        // collision into the WalletModal, so we special case by closing the modal.
        // if (connectionType === ConnectionType.FORTMATIC) {
        //   // toggleWalletModal()
        //   return
        // }

        await connector.activate()

        dispatch(updateSelectedWallet({ wallet: connectionType }))
        onClose()
      } catch (error) {
        console.debug(`web3-react connection error: ${error}`)
        // dispatch(updateConnectionError({ connectionType, error: error.message }))
      }
    },
    [dispatch, onClose]
  )

  const handleDisconnect = useCallback(() => {
    if (connector.deactivate) {
      connector.deactivate()

      // Coinbase Wallet SDK does not emit a disconnect event to the provider,
      // which is what web3-react uses to reset state. As a workaround we manually
      // reset state.
      if (connector === coinbaseWalletConnection.connector) {
        connector.resetState()
      }
    } else {
      connector.resetState()
    }

    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  const wallets = useMemo(() => {
    return <Stack spacing={1.5} sx={{ width: "100%", mb: "8px", mt: "28px" }}>
      <WalletChoice connector={injectedConnection.connector} isMetaMask onClick={handleConnectWallet} />
      <WalletChoice connector={walletConnectConnection.connector} onClick={handleConnectWallet} />
      <WalletChoice connector={coinbaseWalletConnection.connector} onClick={handleConnectWallet} />
    </Stack>
  }, [handleConnectWallet])

  const connectedWallet = useMemo(() => {
    return <SwipeableViews index={connectedWalletStep}>
      <Stack spacing={'24px'} sx={{ mt: '60px' }}>
        <Box
          sx={{
            color: "#262626",
            borderRadius: '10px',
            textTransform: "unset",
            fontWeight: 400,
            lineHeight: "24px",
            bgcolor: "inuse.text",
            border: "1px solid #ECEBF0",
            p: "11px 18px"
          }}
        >
          <Box sx={{
            display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            width: "100%",
          }}>
            <Stack direction={'row'} spacing={'8px'} alignItems={'center'} sx={{
              color: "inuse.blacktext", fontWeight: 700, fontSize: "14px", lineHeight: "18px",
            }}>
              {getConnectionIcon(selectedWallet)}
              <Box sx={{
                fontWeight: 700,
                fontSize: "16px",
                lineHeight: '22px',
                color: "inuse.graytext",
              }}>
                {account?.substring(0, 6)}...{account?.slice(-8)}
              </Box>
            </Stack>
            <Button sx={{
              color: 'inuse.linktext'
            }} disableElevation onClick={() => setConnectedWalletStep(1)}><Trans>Change</Trans></Button>
          </Box>
        </Box>
        <Stack direction={'row'} justifyContent={'flex-end'}>
          <Button variant="contained" disableElevation onClick={handleDisconnect}><Trans>Disconnect</Trans></Button>
        </Stack>
      </Stack>
      {wallets}
    </SwipeableViews>
  }, [account, connectedWalletStep, handleDisconnect, selectedWallet, wallets])

  const dialogTitle = useMemo(() => {
    if (account && selectedWallet) {
      if (connectedWalletStep !== 0) {
        return <IconButton onClick={() => setConnectedWalletStep(0)}>
          <ArrowLeftIcon sx={{ fontSize: "24px" }} />
        </IconButton>
      }
      else {
        return <><Trans>Connected with</Trans>&nbsp;{getConnectionName(selectedWallet, isMetaMask)}</>
      }
    }
    return <Trans>Connect to a wallet</Trans>
  }, [account, connectedWalletStep, isMetaMask, selectedWallet])

  const selectChain = useSelectChain()
  
  return <>
    <CustomDialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "418px"
        }
      }}
    >
      <CustomDialogTitle onClose={onClose}>
        {dialogTitle}
      </CustomDialogTitle>
      {!!account ? <DialogContent> {connectedWallet} </DialogContent> : <DialogContent> {wallets} </DialogContent>}
    </CustomDialog>
    <CustomDialog open={networkModal} onClose={() => {}}>
      <Stack spacing={"8px"} justifyContent={"center"} sx={{
        textAlign: "center", p: "50px", fontSize: "14px", lineHeight: "21px", fontWeight: 500
      }}>
        <Box><NetworkChangeIcon sx={{ width: "40px", height: "40px" }} /></Box>
        <Box sx={{ fontSize: "14px", fontWeight: 500, lineHeight: "22px" }}>
          <Trans>Oops, your wallet is not on the right network</Trans>
        </Box>
        <Box sx={{ fontSize: "12px", fontWeight: 500, lineHeight: "18px", color: "inuse.graytext" }}>
          <Trans>It seems your wallet is running on a different network from harberger.money. please manually change the network in your wallet, or you can click the button below.</Trans>
        </Box>
        <Box>
          <LoadingButton
            loading={networkLoading}
            sx={{ width: "318px", p: "11px 16px", fontWeight: 700, mt: "15px" }}
            onClick={() => {
              setNetworkLoading(true)
              selectChain(DEFAULT_CHAINID).finally(() => setNetworkLoading(false))
            }} variant="contained" disableElevation>
              <Trans>Switch Network</Trans>
          </LoadingButton>
        </Box>
      </Stack>
    </CustomDialog>
  </>
}


export default ConnectWalletDialog;