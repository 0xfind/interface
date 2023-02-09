import { Trans } from "@lingui/macro";
import { Box, Button, Stack } from "@mui/material"
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { setWalletOpenModal } from "../../state/application/reducer";
import { getConnectionIcon } from "../../connectors/utils";

const unConnected = <>
  <Trans>Connect Wallet</Trans>
  {/* <ArrowForwardIcon sx={{ fontSize: "1rem", marginLeft: "6px" }} /> */}
</>

const BarWallet = () => {
  const { account } = useActiveWeb3React()
  const dispatch = useAppDispatch();
  const selectedWallet = useAppSelector((state) => state.user.selectedWallet)
  
  const handleClick = useCallback(() => {
    dispatch(setWalletOpenModal(true))
  }, [dispatch])
  return <Button sx={{
    display: {
      xs: "none",
      sm: "none", 
      md: "flex"
    },
    flexDirection: "row",
    alignItems: "center",
    width: "161px",
    height: "32px",
    bgcolor: "inuse.text",
    borderRadius: "32px",
    boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
    color: "inuse.blacktext",
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "18px",
    "&:hover": {
      bgcolor: 'inuse.text',
    }
  }} onClick={handleClick}>
    {!account && unConnected}
    {!!account && <>
      <Stack direction={"row"} sx={{
        alignItems: "center", justifyContent: "flex-start",
        width: "161px"
      }} spacing={'5.17px'}>
        {getConnectionIcon(selectedWallet)}
        <Box sx={{
          fontWeight: 700,
          fontSize: "16px",
          color: "inuse.graytext",
        }}>
          {account?.substring(0, 6)}...{account?.slice(-4)}
        </Box>
      </Stack>
    </>}
  </Button>
}

export default BarWallet;