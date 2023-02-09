import { Trans } from "@lingui/macro"
import { Link, Stack } from "@mui/material"
import { VideoIcon } from "../Icons"
import { ReactElement, FC } from "react"

type VideoLinkProps = {
  text?: ReactElement
  link?: string
}

export const VideoLink: FC<VideoLinkProps> = ({ text, link }) => {
  return <Link underline="hover" sx={{
    color: "inuse.linktext", fontWeight: 400, fontSize: "14px", lineHeight: "28px", cursor: "pointer"
  }} href={link} target={"_blank"}>
    <Stack direction={"row"} alignItems={"center"}>
      <VideoIcon />
      {text ? text : <Trans>How to create an HBG token?</Trans>}
    </Stack>
  </Link>
}