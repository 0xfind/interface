import InputUnstyled, { InputUnstyledProps } from "@mui/base/InputUnstyled";
import { styled } from "@mui/material";
import { DetailedHTMLProps, ForwardedRef, InputHTMLAttributes } from "react";
import React from "react";

type SearchInputProps = {
  open: boolean;
};

const StyledSearchInputElement = styled(
  React.forwardRef(
    (
      {
        open,
        ...other
      }: SearchInputProps &
        Omit<
          DetailedHTMLProps<
            InputHTMLAttributes<HTMLInputElement>,
            HTMLInputElement
          >,
          keyof SearchInputProps
        >,
      ref: ForwardedRef<HTMLInputElement>
    ) => <input {...other} />
  )
)(
  (props: SearchInputProps) => `
  width: 100%;
  font-size: 1rem;
  font-weight: 500;
  line-height: 17px;
  color: #2C272D;
  background: #D6D5DA;
  border: 0;
  border-radius: ${props.open ? "30px 30px 0 0" : "30px"};
  padding: 18px 36px;

  &:focus {
    outline: 0;
  }`
);

const CustomSearchInput = React.forwardRef(function CustomInput(
  props: InputUnstyledProps & { open: boolean },
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <InputUnstyled
      components={{ Input: StyledSearchInputElement }}
      componentsProps={{ input: { open: props.open } as any }}
      {...props}
      ref={ref}
    />
  );
});

export default CustomSearchInput;
