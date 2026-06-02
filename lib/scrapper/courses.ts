import * as cheerio from "cheerio";

export function scrapeStudentCourseCodes(html: string): string[] {
  const $ = cheerio.load(html);

  const courseTable = $("table").filter((_, table) => {
    const headerText = $(table)
      .find("thead th")
      .toArray()
      .map((th) => $(th).text().trim().toLowerCase())
      .join("|");

    return headerText.includes("codeelem");
  });

  const courseCodes = courseTable
    .find("tbody tr")
    .map((_, row) => $(row).find("td").first().text().trim())
    .get()
    .filter(Boolean);

  return Array.from(new Set(courseCodes));
}
