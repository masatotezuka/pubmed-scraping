import * as ff from "@google-cloud/functions-framework"
import core from "puppeteer-core"
import chromium from "chrome-aws-lambda"

type ScrapingResult = {
  title: string
  abstract: string
  pubmedUrl: string
  originUrl: string
}

ff.http("pubmed-scraping", async (req: ff.Request, res: ff.Response) => {
  try {
    res.set("Access-Control-Allow-Origin", "*")
    const body: { searchWords: string[] } = JSON.parse(req.body)
    const options =
      process.env.NODE_ENV === "production"
        ? {
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
          }
        : {
            args: [],
            executablePath:
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless: false,
          }

    const browser = await core.launch(options)
    const page = await browser.newPage()
    await page.goto("https://pubmed.ncbi.nlm.nih.gov/")
    await page.type(
      "#id_term",
      `${body.searchWords.map((word) => `"${word}"`).join(" ")}`
    )

    await page.click("button.search-btn")
    await page.waitForSelector("a.docsum-title")

    const scrapingResults: ScrapingResult[] = []
    for (let i = 0; i < 10; i++) {
      //   10件目のタイトルが表示されるまで待つ
      await page.waitForSelector(
        `#search-results section div.search-results-chunks div article:nth-child(${
          i + 2
        }) div.docsum-wrap div.docsum-content a`
      )
      await page.click(
        `#search-results section div.search-results-chunks div article:nth-child(${
          i + 2
        }) div.docsum-wrap div.docsum-content a`
      )
      await page.waitForSelector("#full-view-heading h1")

      const title = await page.$eval(
        "#full-view-heading h1.heading-title",
        (el) => el.textContent
      )
      await page.waitForSelector("#abstract")
      const abstract = await page.$eval("#abstract", (el) => el.textContent)
      const pubmedUrl = page.url()
      const originUrl = await page
        .$("#full-view-identifiers li:nth-child(3) span a")
        .then((el) => el?.evaluate((el) => el.getAttribute("href")))
      scrapingResults.push({
        title: title ?? "No title",
        abstract: abstract ?? "No abstract",
        pubmedUrl: pubmedUrl ?? "No pubmedUrl",
        originUrl: originUrl ?? "No originUrl",
      })
      await page.goBack()
    }

    await browser.close()
    res.status(200).json(scrapingResults)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error })
  }
})
