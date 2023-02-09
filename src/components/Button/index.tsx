import ButtonUnstyled, {
  buttonUnstyledClasses,
  ButtonUnstyledProps,
} from "@mui/base/ButtonUnstyled";
import { styled } from "@mui/system";
import * as React from "react";

const CustomButtonRoot = styled("button")`
  font-weight: 700;
  font-size: 1rem;
  background: #ffffff;
  padding: 5px 20px;
  line-height: 22px;
  border-radius: 10px;
  color: #476a30;
  transition: all 150ms ease;
  cursor: pointer;
  border: none;

  &:hover {
    background-color: #fff;
  }

  &.${buttonUnstyledClasses.active} {
    background-color: #fff;
  }

  &.${buttonUnstyledClasses.focusVisible} {
    outline: none;
    box-shadow: 0 4px 20px 0 rgba(61, 71, 82, 0.1),
      0 0 0 5px rgba(0, 127, 255, 0.5);
  }

  &.${buttonUnstyledClasses.disabled} {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const CustomButton = React.forwardRef((props: ButtonUnstyledProps) => {
  return <ButtonUnstyled {...props} component={CustomButtonRoot} />;
});
