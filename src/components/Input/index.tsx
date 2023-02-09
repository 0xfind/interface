import InputUnstyled, { InputUnstyledProps } from "@mui/base/InputUnstyled";
import { Box, styled } from "@mui/material";
import { DebounceInput } from 'react-debounce-input';
import React from "react";

const StyledInputElement = styled("input")(
  () => `
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  line-height: 21px;
  color: #2C272D;
  background: #F4F5F9;
  border: 0;
  border-radius: 10px;
  padding: 11px 15px;

  &:focus {
    outline: 0;
  }`
);

export const CustomInput = React.forwardRef(function CustomInput(
  props: InputUnstyledProps & { tips?: string },
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <>
      <InputUnstyled
        components={{ Input: StyledInputElement }}
        {...props}
        ref={ref}
      />
      {!!props.tips && (
        <Box
          sx={{
            fontSize: "0.875rem",
            color: "#B32F3D",
            ml: "10px",
            mt: "2px",
          }}
        >
          {props.tips}
        </Box>
      )}
    </>
  );
});

type DebounceInputProps = {
  value: string;
  onChange: (value: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CustomDebounceInput = React.forwardRef<HTMLElement, DebounceInputProps>(function CustomDebounceInput(
  props, ref
) {
  const { value, onChange } = props;
  return <DebounceInput
    debounceTimeout={500}
    onChange={onChange}
    value={value}
  ></DebounceInput>
})
