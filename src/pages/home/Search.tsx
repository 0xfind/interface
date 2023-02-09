import { t } from "@lingui/macro";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import StorageIcon from "@mui/icons-material/Storage";
import {
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";

import CustomSearchInput from "../../components/Input/Search";

type Result = {
  id: string;
  name: string;
};

type SearchInputProps = {
  keyword: string;
  setKeyword: (value: string) => void;
  searchResult: Result[];
  defaultOpenList: boolean;
};

const SearchInput: FC<SearchInputProps> = ({
  keyword,
  setKeyword,
  searchResult,
  defaultOpenList
}) => {
  const [searchListOpen, setSearchListOpen] = useState(false);
  const [searchInputOpen, setSearchInputOpen] = useState(false);
  const [defaultOpenListState, setDefaultOpenListState] =
    useState(defaultOpenList);

  const navigate = useNavigate();
  const onChangeSearchInput = useCallback(
    (event) => {
      setDefaultOpenListState(true);
      setKeyword(event.target.value);
    },
    [setKeyword]
  );
  const onClickResult = useCallback(
    (id: string) => {
      navigate(`/${id}`);
    },
    [navigate]
  );
  const onClickSearch = useCallback(() => {
    navigate(`/?search=${keyword}`);
    setSearchListOpen(false);
  }, [keyword, navigate]);

  const onClickNew = useCallback(() => {
    navigate('/create')
    setSearchListOpen(false)
    setKeyword("")
  }, [navigate, setKeyword])

  useEffect(() => {
    if (keyword !== "" && defaultOpenListState) {
      setSearchListOpen(true)
      setSearchInputOpen(true)
    }
    else setSearchListOpen(false);
  }, [defaultOpenListState, keyword]);

  return (
    <>
      <CustomSearchInput
        value={keyword}
        open={searchInputOpen}
        placeholder={t`Search...`}
        onChange={onChangeSearchInput}
      />
      <Collapse in={searchListOpen} timeout="auto" onExited={() => setSearchInputOpen(false)}>
        <List
          component="div"
          disablePadding
          sx={{
            bgcolor: "#D6D5DA",
            borderRadius: "0 0 30px 30px",
            fontWeight: 500,
          }}
        >
          <ListItemButton onClick={onClickSearch} sx={{ pl: 4 }}>
            <ListItemIcon sx={{ minWidth: "35px" }}>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary={keyword} primaryTypographyProps={{
              sx: { wordWrap: "break-word", whiteSpace: "pre-wrap" }
            }} />
          </ListItemButton>
          {searchResult.map((r) => (
            <ListItemButton
              onClick={() => onClickResult(r.id)}
              key={r.id}
              sx={{ pl: 4 }}
            >
              <ListItemIcon sx={{ minWidth: "35px" }}>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText primary={r.name} />
            </ListItemButton>
          ))}
          <ListItemButton
            onClick={onClickNew}
            sx={{
              pl: 4,
              color: "#444A9E",
              pb: 1,
              pt: 1,
              "&:hover": { borderRadius: "0 0 30px 30px" },
            }}
          >
            <ListItemIcon sx={{ color: "#444A9E", minWidth: "35px" }}>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary={t`Create HBG token`} />
          </ListItemButton>
        </List>
      </Collapse>
    </>
  );
};

export default SearchInput;
