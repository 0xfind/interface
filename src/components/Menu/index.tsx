import { Button, Menu, MenuItem } from "@mui/material";
import { MenuItemProps } from "@mui/material/MenuItem/MenuItem";
import React, { ReactElement, useCallback, useMemo, useState } from "react";

type CustomMenuProps = {
  content: ReactElement | string;
  children?: React.ReactNode;
  onClick?: () => void;
};

export const CustomMenuItem = (props: MenuItemProps) => {
  return (
    <MenuItem
      sx={{
        padding: "12px 28px",
        fontWeight: 500,
        lineHeight: "17px",
        textAlign: "center",
        fontSize: "0.875rem",
        "li": {
          marginLeft: "auto",
          marginRight: "auto",
        }
      }}
      {...props}
    />
  );
};

const CustomMenu = (props: CustomMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const handleClick = useCallback((event: any) => {
    if (props.onClick) props.onClick();
    else setAnchorEl(event.currentTarget);
  }, [props]);

  return useMemo(
    () => (
      <>
        <Button
          color="inherit"
          onClick={handleClick}
          sx={{
            "&.MuiButton-root": { fontSize: "1rem" },
          }}
          style={{
            cursor: "default",
            writingMode: "horizontal-tb",
            userSelect: "none",
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {props.content}
        </Button>
        {props.children && (
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                background: "#fff",
                boxShadow: "0 4px 4px rgba(141, 141, 141, 0.25)",
                borderRadius: "10px",
              },
            }}
            MenuListProps={{
              variant: "selectedMenu",
              autoFocusItem: true,
            }}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            {props.children}
          </Menu>
        )}
      </>
    ),
    [anchorEl, handleClick, open, props.children, props.content]
  );
};

export default CustomMenu;
