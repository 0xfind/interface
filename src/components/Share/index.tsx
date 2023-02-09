import { IconButton, Stack, StackProps } from "@mui/material";
import { FC, useCallback } from "react";

import {FacebookIcon, RedditIcon, ShareIcon, TwitterIcon} from "../Icons";

type ShareItem = {
  name: string;
  link: string;
};

type ShareProps = {
  items: ShareItem[];
} & StackProps;

function getIcon(name: string) {
  switch (name) {
    case 'twitter':
      return <TwitterIcon sx={{
        color: "#0062A3",
        '&:hover': {
          color: 'inuse.secondary'
        }
      }} />
    case 'facebook':
      return <FacebookIcon sx={{
        color: "#444A9E",
        '&:hover': {
          color: 'inuse.secondary'
        }
      }} />
    case 'reddit':
      return <RedditIcon sx={{
        color: "#F77923",
        '&:hover': {
          color: 'inuse.secondary'
        }
      }} />
    default:
      return <></>
  }
}

const Share: FC<ShareProps> = ({ items, ...props }) => {
  const onClickShare = useCallback((link: string) => {
    window.open(link, "_blank");
  }, []);

  return (
    <Stack direction="row" {...props}>
      <IconButton sx={{
        pl: '0', pr: '4px'
      }}>
        <ShareIcon sx={{
          color: 'inuse.inputbg',
          '&:hover': {
            color: 'inuse.graytext'
          }
        }} />
      </IconButton>
      {items.map((s) => (
        <IconButton sx={{
          pl: '4px', pr: '4px'
        }} key={s.name} onClick={() => onClickShare(s.link)}>
          {getIcon(s.name)}
        </IconButton>
      ))}
    </Stack>
  );
};

export default Share;
