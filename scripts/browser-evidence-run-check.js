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
    assert((await text(page, "#page-title")) === "Excel→Markdown", "markdown tool should be the default route");
    assert(await page.locator("#excel-input").isVisible(), "markdown input should be visible");
    assert(await page.locator('[data-route="stock"], option[value="stock"], #stock-template').count() === 0, "stock tool should be removed");
    assert(await text(page, "#app-version") === "Ver 1.3.3", "version should use Ver x.y.z format");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "01-markdown-initial.png"),
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

    await page.locator('[data-route="network"]').click();
    await page.waitForURL(/#network$/);
    await page.waitForFunction(() => {
      const el = document.querySelector("#network-status");
      return Boolean(el && !el.textContent.includes("取得しています"));
    });
    const networkExport = await page.locator("#network-export").inputValue();
    assert(networkExport.includes("グローバルIP"), "network export should include public ip row");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "03-network-info.png"),
      fullPage: true,
    });

    await page.locator('[data-route="talk"]').click();
    await page.waitForURL(/#talk$/);
    await page.locator("#talk-input").fill("最初のつぶやき\n2行目");
    await page.locator("#send-talk-message").click();
    const talkMessageCount = await page.locator(".talk-message").count();
    assert(talkMessageCount === 1, "talk tool should save one message");
    assert(await page.locator(".talk-bubble").textContent(), "talk bubble should show message text");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "04-talk-ready.png"),
      fullPage: true,
    });

    await page.locator('[data-route="base64"]').click();
    await page.waitForURL(/#base64$/);
    await page.locator("#base64-input").fill("こんにちは");
    await page.locator("#encode-base64").click();
    const base64Encoded = await page.locator("#base64-output").inputValue();
    assert(base64Encoded.length > 0, "base64 output should be generated");
    await page.locator("#base64-input").fill(base64Encoded);
    await page.locator("#decode-base64").click();
    const base64Decoded = await page.locator("#base64-output").inputValue();
    assert(base64Decoded === "こんにちは", "base64 decoded output should match the original text");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "05-base64-ready.png"),
      fullPage: true,
    });

    await page.locator('[data-route="clipboard"]').click();
    await page.waitForURL(/#clipboard$/);
    await page.locator("#clipboard-input").fill("定型文A");
    await page.locator("#save-clipboard-item").click();
    await page.locator("#clipboard-input").fill("定型文B");
    await page.locator("#save-clipboard-item").click();
    const clipboardCount = await page.locator(".clipboard-card").count();
    assert(clipboardCount === 2, "clipboard tool should save two items");
    await page.locator(".clipboard-card").nth(1).dragTo(page.locator(".clipboard-card").nth(0));
    const firstClipboardText = await page.locator(".clipboard-text").first().textContent();
    assert(firstClipboardText === "定型文B", "clipboard items should be reorderable");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "06-clipboard-ready.png"),
      fullPage: true,
    });

    await page.goto(`${BASE_URL}/#stock`);
    assert(await text(page, "#page-title") === "Excel→Markdown", "old stock links should fall back to markdown");
    assert(await page.locator('[data-route="markdown"]').getAttribute("class").then(value => value.includes("is-active")), "fallback menu should be active");
    await page.goto(`${BASE_URL}/#unknown`);
    assert(await text(page, "#page-title") === "Excel→Markdown", "unknown links should fall back to markdown");

    await page.setViewportSize({ width: 375, height: 812 });
    for (const key of ["markdown", "network", "talk", "base64", "clipboard"]) {
      await page.locator("#tool-select").selectOption(key);
      await page.waitForURL(new RegExp(`#${key}$`));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${key} should fit a mobile viewport`);
    }
    await page.locator("#tool-select").selectOption("markdown");
    await page.waitForURL(/#markdown$/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "07-mobile-markdown.png"), fullPage: true });
    const summary = {
      checked: {
        markdownDefaultView: true,
        stockRemoved: true,
        legacyRouteFallback: true,
        mobileNavigation: true,
        markdownConversion: true,
        networkInfoHandled: true,
        talkHandled: true,
        base64Handled: true,
        clipboardHandled: true,
      },
      deterministicInputs: {
        markdownTable: [
          ["項目", "値"],
          ["売上", "100"],
          ["利益", "25"],
        ],
      },
      final: {
        route: await page.evaluate(() => window.location.hash || "#markdown"),
        pageTitle: await page.title(),
        networkExport,
        talkMessageCount,
        base64Decoded,
        clipboardCount,
        firstClipboardText,
        markdownOutput,
      },
      artifacts: {
        screenshots: [
          "01-markdown-initial.png",
          "02-markdown-ready.png",
          "03-network-info.png",
          "04-talk-ready.png",
          "05-base64-ready.png",
          "06-clipboard-ready.png",
          "07-mobile-markdown.png",
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
