const TALK_STORAGE_KEY = "webtools-talk-messages";
const CLIPBOARD_STORAGE_KEY = "webtools-clipboard-items";

export const STOCK_DATES = [
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

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export function normalizeCode(value) {
  const normalized = value.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
  const match = normalized.match(/^\d{4}[A-Z]?/);
  return match ? match[0] : "";
}

export function formatJapaneseDate(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${year}年${month}月${day}日`;
}

export function buildExcelExportText(rows) {
  const lines = ["日付\t終値"];
  rows.forEach((row) => {
    lines.push(`${row.displayDate}\t${row.priceLabel}`);
  });
  return lines.join("\n");
}

export function buildPriceOnlyText(rows) {
  return rows.map((row) => row.priceLabel).join("\n");
}

export function renderKeyValueRows(resultBody, rows) {
  resultBody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const labelCell = document.createElement("td");
    const valueCell = document.createElement("td");

    labelCell.textContent = row.label;
    valueCell.textContent = row.value;
    valueCell.className = "value-pre";

    tr.append(labelCell, valueCell);
    resultBody.append(tr);
  });
}

export function buildKeyValueText(rows) {
  return rows.map((row) => `${row.label}\t${row.value}`).join("\n");
}

export function buildFallbackNetworkRows({ publicIp, publicIpv6, location, network }) {
  return [
    { label: "グローバルIP(IPv4)", value: publicIp || "不明" },
    { label: "グローバルIP(IPv6)", value: publicIpv6 || "不明" },
    { label: "接続元の推定地域", value: location || "不明" },
    { label: "ネットワーク", value: network || "不明" },
    { label: "参照元", value: document.referrer || "なし" },
    { label: "User Agent", value: navigator.userAgent || "不明" },
    { label: "言語", value: navigator.language || "不明" },
    { label: "タイムゾーン", value: Intl.DateTimeFormat().resolvedOptions().timeZone || "不明" },
    { label: "画面サイズ", value: `${window.screen.width} x ${window.screen.height}` },
    { label: "表示領域", value: `${window.innerWidth} x ${window.innerHeight}` },
    { label: "現在URL", value: window.location.href },
  ];
}

export function formatLocation(data) {
  const values = [data.country, data.region, data.city].filter(Boolean);
  return values.length ? values.join(" / ") : "不明";
}

export function formatNetwork(data) {
  const values = [data.organization_name, data.organization, data.asn].filter(Boolean).join(" / ");
  return values || "不明";
}

export async function fetchBestEffortNetworkData() {
  const [ipv4Result, geoResult] = await Promise.all([
    tryFetchText("https://ipv4.icanhazip.com"),
    tryFetchJson("https://get.geojs.io/v1/ip/geo.json"),
  ]);

  if (geoResult && geoResult.ip) {
    return {
      ...geoResult,
      ipv4: normalizeIpText(ipv4Result),
      ipv6: geoResult.ip && geoResult.ip.includes(":") ? geoResult.ip : "",
    };
  }

  const ipOnlyResult = await tryFetchJson("https://jsonip.com");
  if (ipOnlyResult && ipOnlyResult.ip) {
    return {
      ip: ipOnlyResult.ip,
      ipv4: normalizeIpText(ipv4Result) || ipOnlyResult.ip,
      ipv6: "",
    };
  }

  throw new Error("All network info providers failed");
}

export async function fetchStockHistory(code) {
  const sourceUrl = `https://r.jina.ai/http://stooq.com/q/d/l/?s=${code.toLowerCase()}.jp&i=d`;
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

export function convertExcelTextToMarkdown(text) {
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

export function encodeBase64Text(value) {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64(bytes);
}

export function decodeBase64Text(value) {
  const normalized = value.replace(/\s+/g, "");
  const bytes = base64ToBytes(normalized);
  return new TextDecoder().decode(bytes);
}

export function loadTalkMessages() {
  try {
    const raw = localStorage.getItem(TALK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function saveTalkMessages(messages) {
  localStorage.setItem(TALK_STORAGE_KEY, JSON.stringify(messages));
}

export function loadClipboardItems() {
  try {
    const raw = localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function saveClipboardItems(items) {
  localStorage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(items));
}

export function createMessageId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatTalkTimestamp(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function scrollTalkToBottom(node) {
  node.scrollTop = node.scrollHeight;
}

export function reorderItems(items, sourceId, targetId) {
  const next = [...items];
  const sourceIndex = next.findIndex((item) => item.id === sourceId);
  const targetIndex = next.findIndex((item) => item.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return next;
  }

  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

async function tryFetchJson(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function tryFetchText(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch (error) {
    return "";
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalizeIpText(value) {
  return value ? value.trim() : "";
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

function escapeMarkdownCell(value) {
  return value.replace(/\|/g, "\\|");
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
