import { useEffect, useMemo, useState } from "react";

export function useLocals() {
  const [currentLocals, setCurrentLocals] = useState("en");
  useEffect(() => {
    setCurrentLocals(localStorage.getItem("lang") || "en");
  }, []);
  return currentLocals
}

export function useLocalsInfo() {
  const locals = useLocals()
  const videoId = useMemo(() => {
    switch (locals) {
      case "en":
        return "qs5WH582Llo"
      case "zh":
        return "KIcAwnncYo4"
    }
  }, [locals])

  const whitepaperURL = useMemo(() => {
    switch (locals) {
      case "en":
        return "https://medium.com/@HarbergerToken/0xfind-whitepaper-en-8fca1e0b94a5"
      case "zh":
        return "https://medium.com/@HarbergerToken/0xfind-whitepaper-ch-52cc54256fde"
    }
  }, [locals])

  const tutorialURL = useMemo(() => {
    switch (locals) {
      case "en":
        return "https://medium.com/@HarbergerToken/0xfind-docs-en-2df7cc3bc317"
      case "zh":
        return "https://medium.com/@HarbergerToken/0xfind-docs-ch-7b1f93dfe50c"
    }
  }, [locals])

  const claimTutorialURL = useMemo(() => {
    switch (locals) {
      case "en":
        return "https://medium.com/@HarbergerToken/claim-onft-en-55b7396c7443"
      case "zh":
        return "https://medium.com/@HarbergerToken/claim-onft-ch-7da794ca6e51"
    }
  }, [locals])

  const createTutorialURL = useMemo(() => {
    switch (locals) {
      case "en":
        return "https://medium.com/@HarbergerToken/create-hbgtoken-en-995244069984"
      case "zh":
        return "https://medium.com/@HarbergerToken/create-hbgtoken-ch-5e6de1d8425d"
    }
  }, [locals])

  return useMemo(() => ({
    videoId, whitepaperURL, tutorialURL, claimTutorialURL, createTutorialURL
  }), [claimTutorialURL, createTutorialURL, tutorialURL, videoId, whitepaperURL])
}