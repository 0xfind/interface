import { Box, Fab, Popover } from "@mui/material"
import CallMadeIcon from '@mui/icons-material/CallMade';
import { useState, MouseEvent, useMemo, FC, useCallback } from "react";

type AnchorButtonProp = {
  icon: React.ReactElement;
  popover?: React.ReactElement;
  onClick?: () => void;
}

const AnchorButton: FC<AnchorButtonProp> = ({ icon, popover, onClick }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const open = useMemo(() => !!anchorEl, [anchorEl]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, [])

  return <>
    <Fab size="medium" onClick={(e) => {
      popover ? handleClick(e) : onClick && onClick()
    }} sx={{
      bgcolor: "inuse.text",
      border: "5px solid #FFFFFF",
      "&:hover": {
        bgcolor: "inuse.secondarytext",
      },
      boxShadow: "none",
    }}>
      {icon}
    </Fab>
    {Boolean(popover) && <Popover
      marginThreshold={32}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}

      anchorOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          bgcolor: "transparent",
          borderRadius: "10px",
          boxShadow: "none",
          p: "2px 20px 2px 2px"
        }
      }}
    >
      <Box sx={{
        display: "flex", flexDirection: "row", alignItems: "center", p: "5px 6px",
        bgcolor: "inuse.text", borderRadius: "10px", boxShadow: "0px 2px 2px #D6D5DA",
        width: "200px", cursor: "pointer",
      }}>
        <Box sx={{
          p: "10px 10px", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%",
          borderRadius: "10px",
          "&:hover": {
            bgcolor: "inuse.secondarytext",
          }
        }} onClick={onClick}>
          <Box>{popover}</Box>
          <CallMadeIcon />
        </Box>
      </Box>
    </Popover>}
  </>
}

export default AnchorButton;
