import { forwardRef } from "react";
import { SnackbarContent } from "notistack";
import { Box, Stack } from "@mui/material";
import { DoneIcon } from "../Icons";
import { Trans } from "@lingui/macro";

const NoticeContent = forwardRef<any, any>((props, ref) => {
  return (
    <SnackbarContent ref={ref as any} style={{ minWidth: "317px !important", marginTop: "76px" }}>
      <Box sx={{
        width: "100%", bgcolor: "inuse.blacktext", p: "14px", borderRadius: "10px", color: "inuse.graytext"
      }}>
        <Stack sx={{ minWidth: "48px" }} direction={"row"} spacing={2} alignItems={'center'} justifyContent={"start"}>
          <DoneIcon sx={{ fontSize: "20px" }}/>
          <Stack direction={"column"} sx={{ fontWeight: 500, fontSize: "16px", lineHeight: "24px" }}>
            <Box><Trans>Deals Completed</Trans></Box>
            <Box sx={{ color: "inuse.text" }}>{props.message}</Box>
          </Stack>
        </Stack>
      </Box>
    </SnackbarContent>
  );
});

export default NoticeContent;