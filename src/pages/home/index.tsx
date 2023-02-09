import { Trans } from "@lingui/macro";
import { Box, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import YouTube from 'react-youtube';
import BeatLoader from "react-spinners/ClipLoader";

import { DataCard } from "../../components/Card";
import Share from "../../components/Share";
import HomeTable from "../../components/Table/home";
import { HomeShareItems } from "../../constants/share";
import { useAllTokens } from "../../hooks/useTokens";
import SearchInput from "./Search";
import useActiveWeb3React from "../../hooks/useActiveWeb3React";
import { currentChainId } from "../../constants/chains";
import AnchorButton from "../../components/Button/Anchor";
import { AddTcon, ArrowTopIcon } from "../../components/Icons";
import { SupportedCurrency } from "../../constants/currency";
import { useLocalsInfo } from "../../hooks/useLocales";

const Home = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate()
  const [videoLoading, setVideoLoading] = useState<boolean>(true)
  const searchRouter = useMemo(() => searchParams.get("search"), [searchParams])
  const { videoId } = useLocalsInfo()
  const {chainId} = useActiveWeb3React()
  const [searchKeyword, setSearchKeyword] = useState(searchRouter || "");
  const { data, isLoading, totalFindLocked, searchedData } = useAllTokens(searchKeyword, currentChainId(chainId), 15_000);
  const simpleSearchData = useMemo(() => {
    let td = searchedData;
    if (searchedData.length >= 3) {
      td = searchedData.slice(0, 3);
    }
    return td.map((d) => ({
      id: d.id,
      name: d.name,
    }));
  }, [searchedData]);

  const currentData = useMemo(() => {
    return searchKeyword ? searchedData : data;
  }, [searchKeyword, searchedData, data]);
  const [scrollTopShow, setScrollTopShow] = useState(false);
  const handleScroll = useCallback(() => {
    if (window.pageYOffset > 100) {
      if (!scrollTopShow) setScrollTopShow(true);
    } else {
      if (scrollTopShow) setScrollTopShow(false);
    }
  }, [scrollTopShow]);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, scrollTopShow])
  const handleScrollClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [])
  return (
    <Box sx={{ bgcolor: "inuse.secondarytext" }}>
      <Box
        sx={{
          height: "635px",
          backgroundImage: `url('assets/bg1.png')`,
          backgroundPosition: "left bottom",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Stack
          direction={"row"}
          spacing={"150px"}
          sx={{
            zIndex: -1,
            height: "586px",
            width: "100%",
            bgcolor: "inuse.homebg",
            justifyContent: "center",
          }}
        >
          <Box sx={{ mt: "91px" }}>
            <YouTube
              videoId={videoId}
              opts={{ width: "530.02px", height: "398px" }}
              onReady={() => setVideoLoading(false)}
            />
            <Box sx={{ position: "absolute", top: "155px", width: "530.02px", height: "398px", display: videoLoading ? "grid" : "none", placeItems: "center" }}>
              <BeatLoader size={100} loading color="#D6D5DA" />
            </Box>
            <Box sx={{ width: "530.02px", height: "398px" }} />
          </Box>
          <Box sx={{ width: "445px", ml: "auto", mr: "auto", }}>
            <DataCard
              valueA={totalFindLocked}
              currencyA={SupportedCurrency.FIND}
              valueB={data.length}
              sx={{ mt: "20px", textAlign: 'center' }}
              bees
              beesType="home"
              large
            />
          </Box>
          <Share
            items={HomeShareItems()}
            sx={{
              img: { width: "24px", height: "24px" },
              display: "flex",
              justifyContent: "start",
              position: "absolute",
              top: "520px",
              left: "50%",
              marginLeft: "460px !important",
            }}
          />
        </Stack>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pb: "50px"
        }}
      >
        <Box
          sx={{
            p: {
              xs: "34px 20px 22px 20px",
              sm: "34px 20px 22px 20px",
              md: "45px",
            },
            bgcolor: "#ECEBF0",
            boxShadow: "0px 1px 1px #CBCBCB",
            borderRadius: "20px",
            overflowX: "hidden",
          }}
        >
          <SearchInput
            searchResult={simpleSearchData}
            keyword={searchKeyword}
            setKeyword={setSearchKeyword}
            defaultOpenList={!searchRouter}
          />
          <HomeTable data={currentData} loading={isLoading} />
        </Box>
      </Box>
      <Stack sx={{
        opacity: 1,
        transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        position: "fixed",
        scrollMarginTop: "96px",
        top: "80%",
        left: "50%",
        marginLeft: "618px",
        zIndex: 10,
      }} spacing={"1rem"}>
        <AnchorButton 
          icon={<AddTcon />}
          popover={<Trans>Create HBG token</Trans>}
          onClick={() => { navigate("/create") }}
        />
        {/* <AnchorButton
          icon={<QuestionIcon />}
          popover={<Trans>Visit the FAQs</Trans>}
          onClick={() => { navigate("/docs") }}
        /> */}
        {scrollTopShow && <AnchorButton
          icon={<ArrowTopIcon />}
          onClick={handleScrollClick}
        />}
      </Stack>
    </Box>
  );
};

export default Home;
