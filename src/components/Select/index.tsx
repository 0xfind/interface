import OptionUnstyled, {
  optionUnstyledClasses,
} from "@mui/base/OptionUnstyled";
import PopperUnstyled from "@mui/base/PopperUnstyled";
import SelectUnstyled, {
  selectUnstyledClasses,
  SelectUnstyledProps,
} from "@mui/base/SelectUnstyled";
import { styled } from "@mui/material";
import { ForwardedRef, forwardRef, RefAttributes } from "react";

const StyledButton = styled("button")(
  ({ theme }) => `
  font-size: 14px;
  font-weight: 500;
  box-sizing: border-box;
  min-height: calc(1.5em + 22px);
  width: 100%;
  background: #F4F5F9;
  border: 0;
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  line-height: 1.5;
  color: #2C272D;

  &.${selectUnstyledClasses.focusVisible} {
    outline: 3px solid #8f8fd6;
  }

  &.${selectUnstyledClasses.disabled} {
    background: #F4F5F9;
    color: #9F9F9D !important;
    cursor: not-allowed;
  }
`);

const StyledListBox = styled("ul")(
  ({ theme }) => `
  font-size: 0.875rem;
  box-sizing: border-box;
  padding: 0;
  margin-top: 3px;
  background-color: #F4F5F9;
  border: 0;
  color: #2C272D;
  overflow: auto;
  outline: 0px;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  `
);

export const CustomSelectOption = styled(OptionUnstyled)(
  ({ theme }) => `
  list-style: none;
  padding: 8px 10px;
  cursor: default;
  line-height: 1.5;
  
  &:last-of-type {
    border-bottom: none;
  }

  &:hover:not(.${optionUnstyledClasses.disabled}) {
    background-color: #ECEBF0;
    color: #2C272D;
  }
`);

const StyledPopper = styled(PopperUnstyled)`
  z-index: 1;
`;

export const CustomSelect = forwardRef(function CustomSelect(
  props: SelectUnstyledProps<any>,
  ref: ForwardedRef<HTMLUListElement>
) {
  const components: SelectUnstyledProps<any>["components"] = {
    Root: StyledButton,
    Listbox: StyledListBox,
    Popper: StyledPopper,
    ...props.components,
  };
  return <SelectUnstyled {...props} ref={ref} components={components} />;
}) as (
  props: SelectUnstyledProps<any> &
    RefAttributes<HTMLUListElement> & { simple?: boolean }
) => JSX.Element;
