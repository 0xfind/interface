import { Trans } from "@lingui/macro"
import { Avatar, Box, Button, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { FC } from "react"
import { TokenData } from "../../hooks/useTokens";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { CommonTooltip } from "../Tooltip/Common";
import { VerticalSettingIcon } from "../Icons";
import CurrencyText from "../Box/Currency";
import { useNavigate } from "react-router-dom";
import { EmptyRow } from "../Box/Common";

export type Position = {
  positionId: number,
  findDebt?: CurrencyAmount<Token>,
  collLocked?: CurrencyAmount<Token>,
  findEarning?: CurrencyAmount<Token>,
  token?: TokenData
}

type MortgageProps = {
  data: Position[]
  loading?: boolean
  onClick: (event: any, position?: Position) => void
}

export const MortgageTable: FC<MortgageProps> = ({ data, loading, onClick }) => {
  const navigate = useNavigate()
  return <Box sx={{
    width: "100%",
  }}>
    <TableContainer sx={{ maxHeight: "300px", "::-webkit-scrollbar": { width: "2px", bgcolor: "inuse.text" }, "::-webkit-scrollbar-thumb": { bgcolor: "inuse.scrollbg" } }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={{
            "&>th": {
              fontWeight: 500,
              whiteSpace: "nowrap",
              border: 0
            },
          }}>
            <TableCell sx={{
              width: "178px",
              paddingLeft: "0",
              color: "inuse.graytext"
            }}><Trans>Asset</Trans></TableCell>
            <TableCell sx={{
              width: "144px",
              paddingLeft: "0",
              color: "inuse.graytext"
            }}><Trans>Collateral Locked</Trans></TableCell>
            <TableCell sx={{
              width: "144px",
              paddingLeft: "0",
              color: "inuse.graytext"
            }}><Trans>Debt</Trans></TableCell>
            <TableCell sx={{
              width: "144px",
              paddingLeft: "0",
              color: "inuse.graytext"
            }}><Trans>Earning</Trans></TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && [1, 2, 3].map(() => (<TableRow sx={{
            "&>td": {
              fontWeight: 500, fontSize: "14px", border: 0, p: "0 0 0 0"
            },
            "&>th": {
              border: 0
            },
          }}>
            <TableCell sx={{ border: 'none' }} colSpan={5}>
              <Skeleton animation='wave' variant="rectangular" width={'100%'} height={28} sx={{ marginBottom: "6px" }}/>
            </TableCell>
          </TableRow>))}
          {!loading && data.length === 0 && <TableRow sx={{
            "th, td": {
              fontWeight: 700,
              whiteSpace: "nowrap",
              border: 0,
              pt: "40px"
            },
          }}> 
            <TableCell colSpan={5}><EmptyRow title={<Trans>There is no position</Trans>} /></TableCell>
          </TableRow>}
          {!loading && data.map((row, i) => (
            <TableRow
              key={i}
              onClick={() => {}}
              sx={{
                "&>td": {
                  fontWeight: 500, fontSize: "14px", border: 0, p: "0 0 0 0"
                },
                "&>th": {
                  border: 0
                },
                marginBottom: "14px"
              }}
            >
              <TableCell>
                <Stack direction={"row"} spacing={"8px"} sx={{alignItems: "center"}}>
                  <Avatar sx={{ width: 24, height: 24 }} src={row.token?.logo} />
                  <CommonTooltip title={<Box>
                    {row.token?.symbol} <Box sx={{ color: "inuse.graytext" }}>{row.token?.github.replace("https://", "")}</Box>
                  </Box>} placement="top">
                    <Box onClick={() => navigate(`/${row.token?.id}`)}
                      sx={{
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        width: "120px", cursor: "pointer",
                        "&:hover": { color: "inuse.linktext" }
                      }}>{row.token?.symbol}</Box>
                  </CommonTooltip>
                </Stack>
              </TableCell>
              <TableCell>
                <Box>{row.collLocked?.toSignificant(6)}</Box>
              </TableCell>
              <TableCell>
                <Box>
                  <CurrencyText>{parseFloat(row.findDebt?.toSignificant(6) || '0')}</CurrencyText>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <CurrencyText>{parseFloat(row.findEarning?.toSignificant(6) || '0') }</CurrencyText>
                </Box>
              </TableCell>
              <TableCell>
                <Button onClick={(event) => onClick(event, row)}>
                  <VerticalSettingIcon sx={{ color: "inuse.blacktext" }}/>
                </Button>
              </TableCell>
            </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
}