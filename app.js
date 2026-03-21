const STOCK_DATES = [
  "2010-12-01",
  "2011-12-01",
  "2012-12-03",
  "2013-12-02",
  "2014-12-01",
  "2015-12-01",
  "2016-12-01",
  "2017-12-01",
  "2018-12-03",
  "2019-12-02",
  "2020-12-01",
  "2021-12-01",
  "2022-12-01",
  "2023-12-01",
  "2024-12-02",
  "2025-12-01",
];

const routes = {
  stock: {
    title: "株価取得",
    description:
      "証券コードを入力して、指定日の終値を一覧表示します。Excel に貼り付けやすい形式でまとめてコピーできます。",
    templateId: "stock-template",
    render: renderStockTool,
  },
  markdown: {
    title: "Excel→Markdown",
    description:
      "Excel から貼り付けた表を Markdown のテーブルへ変換します。GitHub やメモ用にそのままコピーできます。",
    templateId: "markdown-template",
    render: renderMarkdownTool,
  },
};

const root = document.querySelector("#tool-root");
const titleNode = document.querySelector("#page-title");
const descriptionNode = document.querySelector("#page-description");
const navButtons = [...document.querySelectorAll(".nav-link")];

window.addEventListener("hashchange", mountRoute);
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.location.hash = button.dataset.route;
  });
});

mountRoute();

function mountRoute() {
  const routeKey = window.location.hash.replace("#", "") || "stock";
  const route = routes[routeKey] || routes.stock;
  const template = document.querySelector(`#${route.templateId}`);

  titleNode.textContent = route.title;
  descriptionNode.textContent = route.description;
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.route === routeKey);
  });

  root.innerHTML = "";
  root.append(template.content.cloneNode(true));
  route.render();
}

function renderStockTool() {
  const input = document.querySelector("#stock-code");
  const fetchButton = document.querySelector("#fetch-stock");
  const copyAllButton = document.querySelector("#copy-stock-all");
  const status = document.querySelector("#stock-status");
  const resultBody = document.querySelector("#stock-results");
  const exportBox = document.querySelector("#stock-export");
  let copiedRows = [];

  fetchButton.addEventListener("click", handleFetch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleFetch();
    }
  });

  copyAllButton.addEventListener("click", async () => {
    if (!copiedRows.length) {
      return;
    }
    const text = buildExcelExportText(copiedRows);
    await copyText(text);
    status.textContent = "Excel 貼り付け用データをコピーしました。";
  });

  async function handleFetch() {
    const code = normalizeCode(input.value);
    if (!code) {
      status.textContent = "4桁の証券コードを入力してください。";
      input.focus();
      return;
    }

    fetchButton.disabled = true;
    copyAllButton.disabled = true;
    resultBody.innerHTML = "";
    exportBox.value = "";
    copiedRows = [];
    status.textContent = `${code} の株価を取得しています...`;

    try {
      const history = await fetchStockHistory(code);
      copiedRows = STOCK_DATES.map((date) => {
        const price = history.get(date);
        return {
          date,
          displayDate: formatJapaneseDate(date),
          priceLabel: price ? price : "データなし",
        };
      });

      renderStockRows(resultBody, copiedRows);
      exportBox.value = buildExcelExportText(copiedRows);
      copyAllButton.disabled = false;
      status.textContent = `${code} の終値を表示しました。`;
    } catch (error) {
      status.textContent =
        "取得に失敗しました。ブラウザ制限またはデータ取得元の応答をご確認ください。";
    } finally {
      fetchButton.disabled = false;
    }
  }
}

function renderStockRows(resultBody, rows) {
  resultBody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const dateCell = document.createElement("td");
    const priceCell = document.createElement("td");

    dateCell.textContent = row.displayDate;
    priceCell.textContent = row.priceLabel;
    priceCell.className = "price-value";
    tr.append(dateCell, priceCell);
    resultBody.append(tr);
  });
}

function renderMarkdownTool() {
  const input = document.querySelector("#excel-input");
  const output = document.querySelector("#markdown-output");
  const convertButton = document.querySelector("#convert-markdown");
  const copyButton = document.querySelector("#copy-markdown");
  const status = document.querySelector("#markdown-status");

  convertButton.addEventListener("click", () => {
    const markdown = convertExcelTextToMarkdown(input.value);
    if (!markdown) {
      output.value = "";
      copyButton.disabled = true;
      status.textContent = "表データを貼り付けてください。";
      return;
    }

    output.value = markdown;
    copyButton.disabled = false;
    status.textContent = "Markdown に変換しました。";
  });

  copyButton.addEventListener("click", async () => {
    if (!output.value) {
      return;
    }
    await copyText(output.value);
    status.textContent = "Markdown をコピーしました。";
  });
}

async function fetchStockHistory(code) {
  const sourceUrl = `https://r.jina.ai/http://stooq.com/q/d/l/?s=${code}.jp&i=d`;
  const response = await fetch(sourceUrl, {
    method: "GET",
    headers: {
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  const rawText = await response.text();
  const csvText = extractCsvText(rawText);
  const records = parseDailyCsv(csvText);
  const history = new Map();

  records.forEach((record) => {
    if (record.Date && record.Close && record.Close !== "0") {
      history.set(record.Date, record.Close);
    }
  });

  return history;
}

function extractCsvText(rawText) {
  const marker = "Markdown Content:";
  const markerIndex = rawText.indexOf(marker);
  const cleaned = markerIndex >= 0 ? rawText.slice(markerIndex + marker.length).trim() : rawText.trim();
  const csvStart = cleaned.indexOf("Date,Open,High,Low,Close,Volume");

  if (csvStart === -1) {
    throw new Error("CSV payload not found");
  }

  return cleaned.slice(csvStart).trim();
}

function parseDailyCsv(csvText) {
  const [headerLine, ...dataLines] = csvText.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",");

  return dataLines.map((line) => {
    const values = line.split(",");
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

function convertExcelTextToMarkdown(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.split("\t").map((cell) => escapeMarkdownCell(cell.trim())))
    .filter((cells) => cells.some((cell) => cell.length > 0));

  if (!rows.length) {
    return "";
  }

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) => {
    const cells = [...row];
    while (cells.length < columnCount) {
      cells.push("");
    }
    return cells;
  });

  const [headerRow, ...bodyRows] = normalizedRows;
  const separator = new Array(columnCount).fill("---");
  const tableRows = [headerRow, separator, ...bodyRows];

  return tableRows.map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function escapeMarkdownCell(value) {
  return value.replace(/\|/g, "\\|");
}

function normalizeCode(value) {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 4 ? digits.slice(0, 5) : "";
}

function formatJapaneseDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${year}年${month}月${day}日`;
}

function buildExcelExportText(rows) {
  const lines = ["日付\t終値"];
  rows.forEach((row) => {
    lines.push(`${row.displayDate}\t${row.priceLabel}`);
  });
  return lines.join("\n");
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}
