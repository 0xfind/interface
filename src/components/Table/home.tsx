import { Trans, t } from "@lingui/macro";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  IconButton, Popover,
  Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme, TableCellProps, Skeleton
} from "@mui/material";
import { FC, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {currentChainId, SupportedChainId} from "../../constants/chains";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { useFindEarnContract } from "../../hooks/useContract";
import { TokenClaimStatus, TokenData } from "../../hooks/useTokens";
import { useAppSelector } from "../../state/hooks";
import { formatPriceChange } from "../../utils";
import ConnectWalletButton from "../Button/ConnectWallet";
import EMPTY from "./assets/empty.png";
import { WETH } from "../../constants/token";
import { ArrowDownIcon, ArrowUpIcon } from "../Icons";
import { CommonTooltip } from "../Tooltip/Common";
import CurrencyText from "../Box/Currency";
import { SupportedCurrency } from "../../constants/currency";
import { getSwapLink } from "../../constants/link";
import { OSP_CNFT_PERCENT, OSP_ONFT_PERCENT } from "../../constants";

const arrowColor = (s: 0 | 1 | -1) => {
  if (!s) return ["#BFBFBF", "#BFBFBF"];
  if (s === 1) return ["#444A9E", "#BFBFBF"];
  else return ["#BFBFBF", "#444A9E"];
};

type HomeTableProps = {
  data: TokenData[];
  loading: boolean;
};

const rowCellBoxSX = {
  alignItems: "center",
  lineHeight: "21px",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
}

const onlyMDSX = {
  display: {
    xs: "none",
    sm: "none",
    md: "table-cell",
  },
}

const headerSX = {
  paddingLeft: "1rem",
}

const TableHeader: FC<TableCellProps & { onlyMD: boolean, width: any }> = ({ onlyMD, width, ...props }) => {
  if (onlyMD) {
    return <TableCell sx={Object.assign({}, headerSX, onlyMDSX, { width })} {...props} />
  }
  return <TableCell sx={Object.assign({}, headerSX, { width })} {...props} />
}

const SkeletonTable = () => <TableRow
  sx={{
    '&:last-child td, &:last-child th': { border: 0 },
    'td:first-of-type': { borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" },
    'td:last-child': { borderTopRightRadius: "10px", borderBottomRightRadius: "10px" },
    "&>td": { paddingTop: "0", paddingBottom: "0" },
  }}
>
  <TableCell sx={{ border: 'none' }} colSpan={8}>
    <Skeleton animation='wave' variant="rectangular" width={'100%'} height={54} />
  </TableCell>
</TableRow>


const HomeTable: FC<HomeTableProps> = ({ data, loading }) => {
  const navigate = useNavigate();
  const [createNFTIncomeAnchorEl, setCreateNFTIncomeAnchorEl] = useState<HTMLElement | null>(null)
  const [ownerNFTIncomeAnchorEl, setOwnerNFTIncomeAnchorEl] = useState<HTMLElement | null>(null)
  const theme = useTheme()
  const isMD = useMediaQuery(theme.breakpoints.up('md'))
  const chainId = useAppSelector((state) => currentChainId(state.application.chainId))
  const { account } = useActiveWeb3React()
  const [sorted, setSorted] = useState<Record<string, 0 | 1 | -1>>({
    ownerNFTIncomeUSD: -1,
  });
  const onClickSorted = useCallback(
    (key: string) => {
      if (!sorted[key]) {
        setSorted((old) => ({ ...old, [key]: 1 }));
      }
      if (sorted[key] === 1) {
        setSorted((old) => ({ ...old, [key]: -1 }));
      }
      if (sorted[key] === -1) {
        setSorted((old) => ({ ...old, [key]: 0 }));
      }
    },
    [sorted]
  );
  const sortedRows = useMemo(() => {
    const r = [...data];
    Object.keys(sorted).forEach((k) => {
      if (!!sorted[k])
        r.sort(
          (firstItem: any, secondItem: any) => firstItem[k] - secondItem[k]
        );
      if (sorted[k] === -1) r.reverse();
    });
    return r;
  }, [data, sorted]);

  const contract = useFindEarnContract(true);

  const [collectButtonLoading, setCollectButtonLoading] = useState<
    Record<string, boolean>
  >({});

  const onClickCollect = useCallback(
    (tokenAddress: string) => {
      if (!contract || !account) return;
      setCollectButtonLoading((old) => ({ ...old, [tokenAddress]: true }));
      contract.collectOspUniswapLPFee(tokenAddress)
        .then((value) => {
          value
            .wait()
            // .then(() => {})
            .catch((reason) => {
              console.log(reason.data?.message || reason.message);
            })
            .finally(() =>
              setCollectButtonLoading((old) => ({ ...old, [tokenAddress]: false }))
            );
        })
        .catch((reason: any) => {
          setCollectButtonLoading((old) => ({ ...old, [tokenAddress]: false }));
        });
    },
    [account, contract]
  );

  const handlePopover = useCallback((t: string, a: string, event?: any) => {
    if (t === "create") {
      if (a === "open") setCreateNFTIncomeAnchorEl(event.currentTarget)
      if (a === "close") setCreateNFTIncomeAnchorEl(null)
    }
    if (t === "owner") {
      if (a === "open") setOwnerNFTIncomeAnchorEl(event.currentTarget)
      if (a === "close") setOwnerNFTIncomeAnchorEl(null)
    }
  }, [])

  const claimORCollectButton = useCallback(
    (row: TokenData) => {
      const sx = {
        textTransform: "unset",
        color: "#444A9E",
        whiteSpace: "nowrap",
      };
      if (row.claimStatus === TokenClaimStatus.CLAIMED) {
        if (!account) return <ConnectWalletButton variant={'text'} sx={sx} text={<Trans>Connect</Trans>} />;
        return (
          <LoadingButton
            loading={collectButtonLoading[row.id] || false}
            onClick={(event) => {
              onClickCollect(row.id)
              event.stopPropagation()
            }}
            disabled={row.ownerNFTOwner.toLowerCase() !== account?.toLowerCase()}
            sx={sx}
          >
            <Trans>Collect</Trans>
          </LoadingButton>
        );
      }
      if (row.claimStatus === TokenClaimStatus.PENDING) {
        return (
          <LoadingButton disabled sx={sx}>
            <Trans>Claim</Trans>
          </LoadingButton>
        );
      }
      return (
        <LoadingButton
          onClick={(event) => {
            navigate(`/${row.id}/claim`)
            event.stopPropagation()
          }}
          endIcon={<AccessTimeIcon />}
          sx={sx}
        >
          <Trans>Claim</Trans>
        </LoadingButton>
      );
    },
    [collectButtonLoading, account, onClickCollect, navigate]
  );

  const claimORCollectMobileButton = useCallback(
    (row: TokenData) => {
      if (
        row.claimStatus === TokenClaimStatus.CLAIMED ||
        row.claimStatus === TokenClaimStatus.PENDING
      ) {
        return <></>;
      }
      return (
        <IconButton
          onClick={() => navigate(`/${row.id}/claim`)}
          sx={{
            display: { md: "none", xs: "block", sm: "block" },
            color: "#444A9E",
            p: "6px 0 6px 0",
            ml: "0 !important",
          }}
        >
          <AccessTimeIcon width={18} height={18} sx={{ mt: "6px" }} />
        </IconButton>
      );
    },
    [navigate]
  );

  const headerCell = useCallback((name, key) => {
    return <Stack direction={"row"} sx={{ alignItems: "center" }}>
      {name}
      <Stack
        sx={{ marginLeft: "1rem" }}
        onClick={() => onClickSorted(key)}
      >
        <ArrowUpIcon sx={{
          width: 8,
          height: 6,
          color: arrowColor(sorted[key])[0],
        }} />
        <ArrowDownIcon sx={{
          width: 8,
          height: 6,
          color: arrowColor(sorted[key])[1],
        }} />
      </Stack>
    </Stack>
  }, [onClickSorted, sorted])

  return (
    <>
      <Box>
        <TableContainer sx={{ overflowX: "hidden" }}>
          <Table sx={{
            borderSpacing: "0px 8px",
            borderCollapse: "separate",
            tableLayout: "fixed",
            width: "1067px",
            overflowX: "hidden",
          }}>
            <TableHead>
              <TableRow sx={{
                "&>th": {
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  border: 0 
                },
              }}>
                <TableHeader onlyMD={false} width={'200px'}><Trans>Name</Trans></TableHeader>
                <TableCell sx={{
                  width: {
                    md: "136px",
                  },
                  paddingLeft: "1rem",
                }}>{headerCell(<Trans>Price</Trans>, "priceUSD")}</TableCell>
                <TableHeader onlyMD={true} width={'136px'}>{headerCell(<Trans>Price Change</Trans>, "priceChange")}</TableHeader>
                <TableHeader onlyMD={true} width={'136px'}>{headerCell(<Trans>24h Trading Vol</Trans>, "volumeUSD")}</TableHeader>
                <TableHeader onlyMD={true} width={'136px'}>{headerCell(<Trans>Create NFT</Trans>, "createNFTIncomeUSD")}</TableHeader>
                <TableHeader onlyMD={true} width={'150px'}>{headerCell(<Trans>Owner NFT</Trans>, "ownerNFTIncomeUSD")}</TableHeader>
                <TableCell sx={{
                  width: {
                    md: "73px",
                  },
                }} />
                <TableCell sx={{
                  width: {
                    md: "100px",
                  },
                }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && data.length === 0 &&  [1, 2, 3, 4, 5].map((i) => <SkeletonTable key={i} />)}
              {data.length !== 0 && sortedRows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => navigate(`/${row.id}`)}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 },
                    'td:first-of-type': {  borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px" },
                    'td:last-child': {  borderTopRightRadius: "10px", borderBottomRightRadius: "10px" },
                    "&>td": {
                      fontWeight: 500,
                      p: "7px 0 7px 16px"
                    },
                    "&:hover": { bgcolor: "inuse.secondarytext" },
                    cursor: "pointer",
                    bgcolor: "inuse.text",
                  }}
                >
                  <TableCell>
                    <Stack
                      direction={"row"}
                      spacing={1.25}
                      sx={{ alignItems: "center" }}
                    >
                      <img
                        style={{
                          borderRadius: "10px",
                        }}
                        src={row.logo}
                        alt=""
                        width={30}
                        height={30}
                      />
                      <CommonTooltip title={<Box>
                        {row.name} <Box sx={{ color: "inuse.graytext" }}>{row.github.replace("https://", "")}</Box>
                      </Box>} placement="top">
                        <Box
                          sx={{
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {row.name}
                        </Box>
                      </CommonTooltip>
                      {claimORCollectMobileButton(row)}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={rowCellBoxSX}>
                      <CurrencyText base={SupportedCurrency.USD} digits={3}>{row.priceUSD}</CurrencyText>
                    </Box>
                  </TableCell>
                  <TableCell sx={onlyMDSX}>
                    <Box sx={rowCellBoxSX}>
                      {row.priceChange === 0 && <span style={{ color: "#476A30" }}>0.00%</span>}
                      {row.priceChange > 0 && <span style={{ color: "#476A30" }}>
                        + {formatPriceChange(row.priceChange)}
                      </span>}
                      {row.priceChange < 0 && <span style={{ color: "#B32F3D" }}>
                        - {formatPriceChange(Math.abs(row.priceChange || 0))}
                      </span>}
                    </Box>
                  </TableCell>
                  <TableCell sx={onlyMDSX}>
                    <Box sx={rowCellBoxSX}>
                      <CurrencyText base={SupportedCurrency.USD}>{row.volumeUSD}</CurrencyText>
                    </Box>
                  </TableCell>
                  <TableCell sx={onlyMDSX}>
                    <Box sx={rowCellBoxSX}
                      onMouseEnter={(e) => handlePopover("create", "open", e)}
                      onMouseLeave={(e) => handlePopover("create", "close", e)}
                    >
                      <CurrencyText base={SupportedCurrency.FIND}>{row.createNFTIncomeFind}</CurrencyText>
                    </Box>
                  </TableCell>
                  <TableCell sx={onlyMDSX}>
                    <Box
                      sx={{
                        paddingTop: "5px",
                        height: "30px",
                        width: "120px !important",
                        textAlign: "center",
                        borderRadius: "10px",
                        backgroundColor: `${row.claimStatus !== TokenClaimStatus.CLAIMED
                            ? "#D9BA2E"
                            : "#476A30"
                          }`,
                        color: `${row.claimStatus !== TokenClaimStatus.CLAIMED
                            ? "#2C272D"
                            : "#FFFFFF"
                          }`,
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => handlePopover("owner", "open", e)}
                      onMouseLeave={(e) => handlePopover("owner", "close", e)}
                    >
                      <CurrencyText base={SupportedCurrency.USD}>{row.ownerNFTIncomeUSD}</CurrencyText>
                    </Box>
                  </TableCell>
                  <TableCell sx={{
                    p: "7px 0 7px 0 !important",
                  }}>
                    <Button
                      target={"_blank"}
                      href={getSwapLink(chainId, WETH[chainId as SupportedChainId].address, row.id)}
                      sx={{
                        textTransform: "unset",
                        color: "#444A9E",
                        textAlign: "center",
                        display: { xs: "none", sm: "none", md: "block" },
                        width: "100%",
                        minWidth: "26px",
                        p: "8px 10px"
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Trans>Buy</Trans>
                    </Button>
                    <Button
                      disableElevation
                      variant={"contained"}
                      target={"_blank"}
                      href={getSwapLink(chainId, WETH[chainId as SupportedChainId].address, row.id)}
                      sx={{
                        textTransform: "unset",
                        color: "#FFFFFF",
                        textAlign: "center",
                        borderRadius: "10px",
                        display: { xs: "block", sm: "block", md: "none" },
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Trans>Buy</Trans>
                    </Button>
                  </TableCell>
                  <TableCell sx={Object.assign({}, onlyMDSX, { p: "7px 0 7px 0 !important" })} onClick={(event) => event.stopPropagation()}>
                    {claimORCollectButton(row)}
                  </TableCell>
                </TableRow>
              ))}
              {(!loading && sortedRows.length === 0) && (
                <TableRow sx={{
                  "th, td": {
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    border: 0
                  },
                }}> 
                  <TableCell
                    colSpan={isMD ? 8 : 3}
                  >
                    <Box sx={{
                      display: 'flex', justifyContent: 'center', flexDirection: 'row', mt: '130px', mb: '26px'
                    }}>
                      <img src={EMPTY} alt="empty" width={"200px"} height={"131px"} />
                    </Box>
                    <Box
                      sx={{
                        textAlign: "center",
                        fontSize: "1.25rem",
                        fontWeight: 500,
                        mb: "237px",
                        color: "#D6D5DA",
                      }}
                    >
                      <Trans>
                        The requested content has not yet been created, please try again in a few moments.
                      </Trans>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              <Popover
                sx={{ pointerEvents: 'none' }}
                PaperProps={{
                  sx: {
                    maxWidth: "250px",
                    bgcolor: "#2C272D",
                    boxShadow: "0px 2px 2px #D6D5DA",
                    borderRadius: "10px",
                    color: "#fff",
                    fontWeight: 500,
                  }
                }}
                open={Boolean(createNFTIncomeAnchorEl)}
                anchorEl={createNFTIncomeAnchorEl}
                anchorOrigin={{
                  vertical: 'center',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'center',
                  horizontal: 'left',
                }}
                onClose={() => handlePopover("create", "close")}
                disableRestoreFocus
              >
                <Typography sx={{ p: "6px 8px", fontSize: "14px", fontWeight: 500, lineHeight: "21px" }}>{t`Create NFT is created when the HBG token is created, and is owned by the creator for the cost of the HBG's GitHub star * 0.1$FIND, and Open source projects can be free, and the holder has the right to collect ${OSP_CNFT_PERCENT} LP fee permanently.`}</Typography>
              </Popover>
              <Popover
                sx={{ pointerEvents: 'none' }}
                PaperProps={{
                  sx: {
                    maxWidth: "230px",
                    bgcolor: "#2C272D",
                    boxShadow: "0px 2px 2px #D6D5DA",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#fff",
                    fontWeight: 500,
                  }
                }}
                open={Boolean(ownerNFTIncomeAnchorEl)}
                anchorEl={ownerNFTIncomeAnchorEl}
                anchorOrigin={{
                  vertical: 'center',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'center',
                  horizontal: 'left',
                }}
                onClose={() => handlePopover("owner", "close")}
                disableRestoreFocus
              >
                <Typography sx={{ p: "6px 8px", fontSize: "14px", fontWeight: 500, lineHeight: "21px" }}>{t`Open source projects are eligible to claim Owner NFT for free and thus have the right to ${OSP_ONFT_PERCENT} LP fee in permanently.`}</Typography>
              </Popover>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default HomeTable;
