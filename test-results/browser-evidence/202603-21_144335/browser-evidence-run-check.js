const fs = require("fs");
const path = require("path");

function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_NODE_PATH,
    "/home/ryu/.npm/_npx/e41f203b7505f1fb/node_modules",
    "/home/ryu/.npm/_npx/705bc6b22212b352/node_modules",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const playwright = require(path.join(candidate, "playwright"));
      process.env.NODE_PATH = candidate;
      return playwright;
    } catch (error) {
      // Try the next known shared install.
    }
  }

  try {
    return require("playwright");
  } catch (error) {
    throw new Error("Playwright could not be loaded from the project or known shared installs.");
  }
}

const { chromium } = loadPlaywright();

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4173";
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || "/tmp/browser-evidence-artifacts";
const VIDEO_DIR = path.join(ARTIFACT_DIR, "video");
const FINAL_VIDEO_PATH = path.join(ARTIFACT_DIR, "webtools-run.webm");
const SUMMARY_PATH = path.join(ARTIFACT_DIR, "run-summary.json");
const CHROMIUM_PATH =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ||
  "/home/ryu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function text(page, selector) {
  return (await page.locator(selector).textContent())?.trim() || "";
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1400 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1440, height: 1400 },
    },
  });
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });
    await page.evaluate(() => localStorage.clear());

    assert((await page.title()) === "Web Tools", "page title should be Web Tools");
    assert((await text(page, "#page-title")) === "株価取得", "stock tool should be the default route");
    assert(await page.locator("#stock-code").isVisible(), "stock code input should be visible");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "01-stock-initial.png"),
      fullPage: true,
    });

    await page.locator('[data-route="markdown"]').click();
    await page.waitForURL(/#markdown$/);
    await page.locator("#excel-input").fill("項目\t値\n売上\t100\n利益\t25");
    await page.locator("#convert-markdown").click();

    const markdownOutput = await page.locator("#markdown-output").inputValue();
    assert(markdownOutput.includes("| 項目 | 値 |"), "markdown header should be generated");
    assert(markdownOutput.includes("| 売上 | 100 |"), "markdown body should be generated");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "02-markdown-ready.png"),
      fullPage: true,
    });

    await page.locator('[data-route="stock"]').click();
    await page.waitForURL((url) => !url.hash || url.hash === "#stock");
    await page.locator("#stock-code").fill("9434");
    await page.locator("#fetch-stock").click();
    await page.waitForFunction(() => {
      const el = document.querySelector("#stock-status");
      return Boolean(el && !el.textContent.includes("取得しています"));
    });

    const stockStatus = await text(page, "#stock-status");
    assert(stockStatus.length > 0, "stock status should be populated");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "03-stock-result.png"),
      fullPage: true,
    });

    const tableRows = await page.locator("#stock-results tr").count();
    const copyAllDisabled = await page.locator("#copy-stock-all").isDisabled();
    const summary = {
      checked: {
        stockDefaultView: true,
        markdownConversion: true,
        stockRequestHandled: true,
      },
      deterministicInputs: {
        markdownTable: [
          ["項目", "値"],
          ["売上", "100"],
          ["利益", "25"],
        ],
        stockCode: "9434",
      },
      final: {
        route: await page.evaluate(() => window.location.hash || "#stock"),
        pageTitle: await page.title(),
        stockStatus,
        stockRows: tableRows,
        copyAllDisabled,
        markdownOutput,
      },
      artifacts: {
        screenshots: [
          "01-stock-initial.png",
          "02-markdown-ready.png",
          "03-stock-result.png",
        ],
        video: path.basename(FINAL_VIDEO_PATH),
      },
    };

    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      await video.saveAs(FINAL_VIDEO_PATH);
    }
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error.stack || String(error));
  process.exit(1);
});
