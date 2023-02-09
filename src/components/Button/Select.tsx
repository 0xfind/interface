import { Button, ButtonProps } from "@mui/material";
import { FC } from "react";

type SelectButtonProps = {
  selected: boolean;
} & ButtonProps


const SelectButton: FC<SelectButtonProps> = ({ selected, ...props }) => {
  return <Button sx={{
    bgcolor: `${selected ? "inuse.barbg" : "inuse.text"}`,
    borderRadius: "32px",
    width: "120px",
    color: `${selected ? "inuse.text" : "inuse.graytext"}`,
    p: '8px 20.5px',
    "&:hover": {
      // outline: `${selected ? "none" : "1px solid #9F9F9D"}`,
      // outline: `${selected ? "none" : "1px solid #9F9F9D"}`,
      bgcolor: `${selected ? "inuse.barbg" : "inuse.secondarytext"}`,
    }
  }} {...props} />
}

export default SelectButton;