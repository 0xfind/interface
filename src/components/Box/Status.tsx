import { Trans } from "@lingui/macro"
import { Box, Button, Stack } from "@mui/material"

export const Status404 = () => {
  return <Box
    sx={{
      backgroundImage: `url('/assets/bg2.png')`,
      backgroundPosition: "right bottom",
      backgroundRepeat: "no-repeat",
      minHeight: "calc(100vh - 64px)",
      display: "grid",
      placeItems: "center",
    }}
  >
    <Stack direction={"column"} alignItems={'center'} spacing={'18px'}>
      <Box sx={{ fontWeight: 700, color: "inuse.blacktext", fontSize: "100px", lineHeight: "122px" }}>404</Box>
      <Box sx={{ fontWeight: 700, fontSize: "36px", lineHeight: "44px", color: "inuse.graytext" }}><Trans>Oops, This Page Not Found!</Trans></Box>
      <Box sx={{ fontWeight: 400, fontSize: "28px", lineHeight: "24px", color: "inuse.hoverbg" }}><Trans>The link might be incorrect</Trans></Box>
      <Box><Button variant="contained" disableElevation href="/"><Trans>Go Back Home</Trans></Button></Box>
    </Stack>
  </Box>
}