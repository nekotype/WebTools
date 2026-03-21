import {
  buildExcelExportText,
  buildPriceOnlyText,
  copyText,
  fetchStockHistory,
  formatJapaneseDate,
  normalizeCode,
  STOCK_DATES,
} from "../utils.js";

export function renderStockTool() {
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
    await copyText(buildPriceOnlyText(copiedRows));
    status.textContent = "株価だけをコピーしました。";
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
      copiedRows = STOCK_DATES.map((date) => ({
        date,
        displayDate: formatJapaneseDate(date),
        priceLabel: history.get(date) || "データなし",
      }));

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
