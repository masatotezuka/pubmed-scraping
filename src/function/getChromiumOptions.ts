import chromium from "chrome-aws-lambda"

export const getChromiumOptions = async () => {
  return process.env.NODE_ENV === "production"
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
}
