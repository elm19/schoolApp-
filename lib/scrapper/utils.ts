import * as cheerio from "cheerio";


export const visitUrl = async ({
  toVisiteUrl = "https://schoolapp.ensam-umi.ac.ma/plan-etudes-view/filieres",
  returnContent = false,
  sessionId,
}: {
  toVisiteUrl?: string;
  returnContent?: boolean;
  sessionId?: string | null;
}) => {
  if (!sessionId) return false;

  const res = await fetch(toVisiteUrl, {
    headers: {
      Cookie: `JSESSIONID=${sessionId}`,
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
  });
  const resContent = await res.text();

  const $ = cheerio.load(resContent);
  const isAuthenticated =
    $('form[action="/login"]').length === 0 &&
    $('a[href*="logout"]').length > 0;
  if (!isAuthenticated) {
    return false;
  }
  return returnContent
    ? {
        isAuthenticated,
        data: resContent,
      }
    : true;
};