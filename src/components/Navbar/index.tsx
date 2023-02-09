import { Trans } from "@lingui/macro";
import { Box, Button, Drawer, Stack } from "@mui/material";
import { useState, useCallback } from "react";
import Left from "./Left";
import MobileMenu from "./MobileMenu";
import NavSettings from "./NavSettings";
import BarWallet from "./BarWallet";
import ConnectWalletDialog from "../Dialog/ConnectWallet";
import { DoneDialog } from "../Dialog/Common";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { useNavigate } from "react-router-dom";
import { setDoneOpenModal } from "../../state/application/reducer";

const Navbar = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate()
  const doneDialogOpen = useAppSelector((state) =>
    state.application.openDoneModal || false
  )
  const handleCloseDoneDialog = useCallback(() => {
    dispatch(setDoneOpenModal(false));
  }, [dispatch]);
  return (
    <Box
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        height: 65,
        padding: {
          xs: "15px",
          sm: "15px",
          md: "15px 50px",
        },
        bgcolor: "#59774E",
        color: "inuse.text",
        flexDirection: "row",
        display: "flex",
        position: "relative",
        zIndex: 99,
      }}
    >
      <Box sx={{
        maxWidth: "1200px",
        minWidth: "0px",
        width: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        display: "flex",
      }}>
        <Left />
        <Stack direction="row" sx={{
          alignItems: "center",
        }} spacing={"14px"}>
          <BarWallet />
          <NavSettings />
          <Button
            variant="outlined"
            disableElevation
            sx={{
              display: { md: "none" },
              bgcolor: "#fff",
              borderRadius: "10px",
              color: "#476A30",
              "&:hover": { bgcolor: "#fff", color: "#476A30" },
            }}
            onClick={() => setMobileMenu(true)}
          >
            <Trans>Menu</Trans>
          </Button>
        </Stack>
        <Drawer
          anchor={"top"}
          open={mobileMenu}
          variant="temporary"
          ModalProps={{
            keepMounted: true,
          }}
          onClose={() => setMobileMenu(false)}
        >
          <MobileMenu onClose={() => setMobileMenu(false)} />
        </Drawer>
      </Box>
      <ConnectWalletDialog />
      <DoneDialog
        open={doneDialogOpen}
        onClose={handleCloseDoneDialog}
        text={<Trans>Created successfully!</Trans>}
        nextButton={
          <Button sx={{
            width: "318px", p: "11px 16px", fontWeight: 700
          }} onClick={() => {
            handleCloseDoneDialog()
            navigate('/')
          }} variant="contained" disableElevation ><Trans>Back to home</Trans></Button>
        }
      />
    </Box>
  );
};

export default Navbar;
