import * as ff from "@google-cloud/functions-framework"
import core from "puppeteer-core"
import { getChromiumOptions } from "./function/getChromiumOptions"
import {
  PUBMED_URL,
  SEARCH_BUTTON_SELECTOR,
  FORM_SELECTOR,
  PAPER_LINK_SELECTOR,
} from "./constants"
import { scrapeArticleDetails } from "./function/scrapeArticleDetails"

type ScrapingResult = {
  title: string
  abstract: string
  pubmedUrl: string
  originUrl: string
}

ff.http("pubmed-scraping", async (req: ff.Request, res: ff.Response) => {
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET, POST")
  res.set("Access-Control-Allow-Headers", "Content-Type")

  try {
    const body: { searchWords: string[] } = req.body
    const browser = await core.launch(await getChromiumOptions())
    const page = await browser.newPage()

    await page.goto(PUBMED_URL)
    await page.type(
      FORM_SELECTOR,
      `${body.searchWords.map((word) => `"${word}"`).join(" ")}`
    )
    await page.click(SEARCH_BUTTON_SELECTOR)
    await page.waitForSelector(PAPER_LINK_SELECTOR)

    const scrapingResults: ScrapingResult[] = []

    for (let i = 0; i < 10; i++) {
      const result = await scrapeArticleDetails({ page, index: i })
      scrapingResults.push(result)
      await page.goBack()
    }

    await browser.close()
    res.status(200).json(scrapingResults)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error })
  }
})
