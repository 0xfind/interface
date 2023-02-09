import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';


export const CommonTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.inuse.text,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.inuse.blacktext,
    borderRadius: "10px",
    fontSize: "14px"
  },
}));