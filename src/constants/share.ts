export const HomeShareItems = () => {
  const url = encodeURIComponent(`${window.document.location.protocol}//${window.document.location.host}`)
  return [
    {
      name: "twitter",
      link: `https://twitter.com/intent/tweet?url=${url}&text=${encodeURIComponent(`#Harberger #Opensource #Token`)}`,
    },
    {
      name: "facebook",
      link: `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${encodeURIComponent(`#Harberger #Opensource #Token`)}`,
    },
    {
      name: "reddit",
      link: `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(`#Harberger #Opensource #Token`)}`,
    },
  ];
};

const shareDomain = `${process.env.REACT_APP_SHARE_URL}/t/`

export const ShareItems = (id?: string, text?: string) => {
  const url = encodeURIComponent(shareDomain+id)
  const encodeText = encodeURIComponent(text || "")
  return [
    {
      name: "twitter",
      link: `https://twitter.com/intent/tweet?url=${url}&text=${encodeText}`,
    },
    {
      name: "facebook",
      link: `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${encodeText}`,
    },
    {
      name: "reddit",
      link: `https://www.reddit.com/submit?url=${url}&title=${encodeText}`,
    },
  ];
}
