import { Trans } from "@lingui/macro";
import { Button } from "@mui/material";

import {
  setWalletOpenModal,
} from "../../state/application/reducer";
import { useAppDispatch } from "../../state/hooks";

const ConnectWalletButton = ({text, ...props}: any) => {
  const dispatch = useAppDispatch();
  return (
    <Button
      variant="contained"
      onClick={() =>
        dispatch(setWalletOpenModal(true))
      }
      disableElevation
      {...props}
    >
      {text || <Trans>Connect Wallet</Trans>}
    </Button>
  );
};

export default ConnectWalletButton;
