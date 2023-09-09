import { Page } from "puppeteer-core"

import {
  TITLE_SELECTOR,
  ABSTRACT_SELECTOR,
  ORIGIN_URL_SELECTOR,
} from "../constants"

type Params = {
  page: Page
  index: number
}

export async function scrapeArticleDetails(params: Params) {
  const { page, index } = params
  const ARTICLE_SELECTOR = `#search-results section div.search-results-chunks div article:nth-child(${
    index + 2
  }) div.docsum-wrap div.docsum-content a`

  await page.waitForSelector(ARTICLE_SELECTOR)
  await page.click(ABSTRACT_SELECTOR)

  // 詳細ページの読み込みを待つ
  await page.waitForSelector(TITLE_SELECTOR)
  await page.waitForSelector(ABSTRACT_SELECTOR)
  const title = await page.$eval(TITLE_SELECTOR, (el) => el.textContent)
  const abstract = await page.$eval(ABSTRACT_SELECTOR, (el) => el.textContent)
  const pubmedUrl = page.url()
  const originUrl = await page
    .$(ORIGIN_URL_SELECTOR)
    .then((el) => el?.evaluate((el) => el.getAttribute("href")))

  return {
    title: title ?? "No title",
    abstract: abstract ?? "No abstract",
    pubmedUrl: pubmedUrl ?? "No pubmedUrl",
    originUrl: originUrl ?? "No originUrl",
  }
}
