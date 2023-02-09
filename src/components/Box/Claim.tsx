import { Trans } from "@lingui/macro"
import { LoadingButton } from "@mui/lab"
import { Box, Grid, Stack } from "@mui/material"
import { FC, ReactElement } from "react"
import { TickIcon } from "../Icons"

type LeftBadgeProps = {
  step: number, text: ReactElement, done: boolean, current: number
}

export const ClaimLeftBadge: FC<LeftBadgeProps> = ({ step, text, done, current }) => {
  return <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}
    sx={{
      height: "70px", width: "284px", borderRadius: "10px",
      bgcolor: `${done ? "primary.main" : "inuse.inputbg"}`,
      fontWeight: "700", color: "inuse.text",
      padding: "24px 30px",
      cursor: "default",
    }}
  >
    <Stack direction={'row'} alignItems={'center'} spacing={'14px'}>
      <Box sx={{ fontSize: "2.25rem" }}>{step}</Box>
      <Box sx={{ fontSize: "1.125rem"}}>{text}</Box>
    </Stack>
    {current > step && <TickIcon />}
  </Stack>
}

type RightContentProps = {
  show: boolean,
  title: ReactElement,
  errTips?: string,
  handleVerify?: () => void,
  children: ReactElement[],
  verifyDisabled?: boolean,
  verifyLoading?: boolean,
  noVerify?: boolean,
}

export const ClaimRightContent: FC<RightContentProps> = ({ show, title, errTips, verifyDisabled, verifyLoading, handleVerify, noVerify, children }) => {
  if (!show) return <></>
  return <Grid item xs={12} md={8}>
    <Box sx={{ fontWeight: "700", fontSize: "1.125rem" }}>{title}<span style={{ color: "#FF6D4B", marginLeft: "7px" }}>*</span></Box>
    <Stack spacing={"16px"} sx={{ mt: "16px", mb: "24px" }}>
      {children}
    </Stack>
    {!noVerify && <Stack direction={"row"} sx={{ mt: "18px" }} alignItems={"center"} spacing={"18px"}>
      <LoadingButton
        variant="contained"
        disabled={verifyDisabled || false}
        disableElevation
        onClick={handleVerify}
        loading={verifyLoading}
      >
        <Trans>Verify</Trans>
      </LoadingButton>
      {!!errTips && <Box sx={{ fontSize: "14px", color: "inuse.error" }}>
        {errTips}
      </Box>}
    </Stack>}
  </Grid>
}
