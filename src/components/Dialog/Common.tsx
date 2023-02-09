import { Box } from "@mui/material"
import { FC, ReactElement } from "react"
import { CustomDialog, CustomDialogTitle } from "."
import { DoneIcon } from "../Icons"

type DoneDialogProps = {
  open: boolean
  share?: ReactElement
  onClose: () => void
  text: ReactElement
  nextButton?: ReactElement
}

export const DoneDialog: FC<DoneDialogProps> = ({ open, share, onClose, text, nextButton }) => {
  return <CustomDialog open={open} onClose={onClose}>
    <CustomDialogTitle onClose={onClose} />
    <Box sx={{
      display: "flex", flexDirection: "column", textAlign: "center", justifyContent: "center"
    }}>
      <Box sx={{
        display: "flex", flexDirection: "row", textAlign: "center", justifyContent: "center"
      }}>
        <DoneIcon width={'40px'} height={'40px'} sx={{ color: '#000', fontSize: "40px" }} />
      </Box>
      <Box sx={{
        mt: "8px", fontSize: "0.875rem", color: "#1A1A1A", fontWeight: 500
      }}>{text}</Box>
      {share}
    </Box>
    {!!nextButton && <Box sx={{ width: "318px", m: "24px auto 40px auto" }}>
      {nextButton}
    </Box>}
  </CustomDialog>
}