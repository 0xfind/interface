import { Trans } from "@lingui/macro";
import { t } from "@lingui/macro";
import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { Box } from "@mui/material";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { useCallback, useEffect, useState } from "react";

import { SupportedChainId } from "../../constants/chains";
import { getScanLink } from "../../constants/link";
import { useApproval } from "../../hooks/useApproval";

type ApproveButtonProps = {
  tokenAmount?: CurrencyAmount<Token>;
  spender?: string;
  chainId: SupportedChainId;
} & LoadingButtonProps;

const ApproveButton = ({
  tokenAmount,
  spender,
  chainId,
  ...props
}: ApproveButtonProps) => {
  const [contractResult, setContractResult] = useState<ContractResultData>()

  useEffect(() => {
    if (contractResult && contractResult.isError && contractResult.msg) {
      setTimeout(() => {
        setContractResult(undefined)
      }, 5000)
    }
  }, [contractResult])

  const [, approval] = useApproval(tokenAmount, spender);
  const [loading, setLoading] = useState<boolean>(false);
  const handleApproval = useCallback(() => {
    setLoading(true);
    approval()
      .then((data) => {
        if (!data) return;
        const { response } = data;
        response
          ?.wait()
          .then(() => {
            setContractResult(undefined);
          })
          .catch((reason) => {
            setContractResult({
              isError: true,
              msg: reason.data?.message || reason.message,
            });
          })
          .finally(() => setLoading(false));
        setContractResult({
          isError: false,
          msg: t`transaction link`,
          link: getScanLink(chainId, response.hash),
        });
      })
      .catch((reason: any) => {
        setContractResult({
          isError: true,
          msg: reason.data?.message || reason.message,
        });
        setLoading(false);
      });
  }, [approval, chainId, setContractResult]);
  return  <>
    <LoadingButton
      loading={loading}
      variant="contained"
      onClick={handleApproval}
      disableElevation
      {...props}
    >
      <Trans>Approve</Trans>
    </LoadingButton>
    {contractResult?.isError ? (
      <Box
        sx={{
          textAlign: "center",
          width: "100%",
          color: contractResult.color ?? "#B32F3D",
          mt: "16px",
          mb: "25px",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {contractResult.msg}
      </Box>
    ) : (
      <Box
        sx={{ textAlign: "center", width: "100%", mt: "16px", mb: "25px" }}
      >
        <a
          href={contractResult?.link}
          target={"_blank"}
          rel={"noreferrer"}
          style={{
            fontSize: "0.875rem",
            color: "#444A9E",
            textDecoration: "underline",
          }}
        >
          {contractResult?.msg}
        </a>
      </Box>
    )}
  </>
};

export default ApproveButton;
