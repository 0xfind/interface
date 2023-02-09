import CloseIcon from "@mui/icons-material/Close";
import {
  Box, Dialog, DialogProps, DialogTitle, DialogTitleProps, IconButton, Stack, styled
} from "@mui/material";
import { FC } from "react";

export const CustomDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    paddingRight: 27,
    paddingLeft: 27,
  },
  "& .MuiDialogActions-root": {},
  "& .MuiDialogTitle-root": {
    textAlign: "center",
    padding: "20px 15px 13px 23px",
  },
  "& .MuiPaper-root": {
    backgroundColor: "#fff",
    width: "418px",
    boxShadow: "0px 4px 8px rgba(47, 128, 237, 0.05)",
    borderRadius: '20px',
    border: '1px solid #F4F5F9'
  },
}));

const DetailDialogStyle = (width?: string) => ({
  "& .MuiDialogContent-root": {
    paddingRight: 27,
    paddingLeft: 27,
  },
  "& .MuiDialogActions-root": {},
  "& .MuiDialogTitle-root": {
    textAlign: "center",
    padding: "20px 15px 13px 23px",
  },
  "& .MuiPaper-root": {
    backgroundColor: "#fff",
    width: width ? width : "418px",
    boxShadow: "0px 4px 8px rgba(47, 128, 237, 0.05)",
    borderRadius: '20px',
    border: '1px solid #F4F5F9',
    maxWidth: '800px'
  },
})

type DetailDialogProps = DialogProps & {
  width?: string;
}

export const DetailDialog: FC<DetailDialogProps> = ({ ...props }) => {
  const { width, sx, ...rest } = props;
  return <Dialog sx={({ ...sx, ...DetailDialogStyle(width) })} {...rest}  />
}

export const CustomDialogTitle = (
  props: DialogTitleProps & { onClose: () => void }
) => {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 0 }} {...other}>
      <Stack direction={"row"} justifyContent="space-between" alignItems={"center"}>
        <Box sx={{
          fontWeight: 500, fontSize: "16px", lineHeight: "24px"
        }}>{children}</Box>
        {onClose ? (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon sx={{fontSize: "24px"}} />
          </IconButton>
        ) : null}
      </Stack>
    </DialogTitle>
  );
};
