import { Trans } from "@lingui/macro";
import LoadingButton from "@mui/lab/LoadingButton";
import { Box, Fade } from "@mui/material";
import { FC } from "react";

export const CreateButtonSX = {
  width: "100%",
  mt: "16px",
  p: '11px 0',
  fontWeight: "700",
  fontSize: "14px",
  lineHeight: "18px",
  color: "inuse.text",
  textTransform: "capitalize",
  borderRadius: "10px",
};

type CreateButtonProps = {
  loading: boolean
  onClick: () => void
  contractResult?: ContractResultData
}

export const CreateButton: FC<CreateButtonProps> = ({ loading, onClick, contractResult }) => {
  return <>
    <LoadingButton
      loading={loading}
      variant="contained"
      disableElevation
      sx={CreateButtonSX}
      onClick={onClick}
    >
      <Trans>Create</Trans>
    </LoadingButton>
    <Fade in={!!contractResult}>
      <Box
        sx={{
          textAlign: "center",
          width: "100%",
          color: contractResult?.color ?? "#B32F3D",
          mt: "16px",
          mb: "25px",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {contractResult?.isError ? <>{contractResult?.msg}</> : <a href={contractResult?.link} target={"_blank"} rel={"noreferrer"}
          style={{ fontSize: "0.875rem", color: "#444A9E", textDecoration: "underline" }}
        >
          {contractResult?.msg}
        </a>}
      </Box>
    </Fade>
  </>
}