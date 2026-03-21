import {
  buildFallbackNetworkRows,
  buildKeyValueText,
  copyText,
  fetchBestEffortNetworkData,
  formatLocation,
  formatNetwork,
  renderKeyValueRows,
} from "../utils.js";

export function renderNetworkTool() {
  const refreshButton = document.querySelector("#refresh-network-info");
  const copyButton = document.querySelector("#copy-network-info");
  const status = document.querySelector("#network-status");
  const resultBody = document.querySelector("#network-results");
  const exportBox = document.querySelector("#network-export");
  let rows = [];

  refreshButton.addEventListener("click", handleRefresh);
  copyButton.addEventListener("click", async () => {
    if (!rows.length) {
      return;
    }
    await copyText(exportBox.value);
    status.textContent = "接続情報をコピーしました。";
  });

  handleRefresh();

  async function handleRefresh() {
    refreshButton.disabled = true;
    copyButton.disabled = true;
    resultBody.innerHTML = "";
    exportBox.value = "";
    status.textContent = "接続情報を取得しています...";

    try {
      const apiData = await fetchBestEffortNetworkData();
      rows = buildFallbackNetworkRows({
        publicIp: apiData.ipv4 || apiData.ip || "不明",
        publicIpv6: apiData.ipv6 || "不明",
        location: formatLocation(apiData),
        network: formatNetwork(apiData),
      });
      renderKeyValueRows(resultBody, rows);
      exportBox.value = buildKeyValueText(rows);
      copyButton.disabled = false;
      status.textContent = "接続情報を表示しました。";
    } catch (error) {
      rows = buildFallbackNetworkRows({
        publicIp: "取得失敗",
        publicIpv6: "取得失敗",
        location: "外部APIの取得に失敗しました",
        network: "不明",
      });
      renderKeyValueRows(resultBody, rows);
      exportBox.value = buildKeyValueText(rows);
      copyButton.disabled = false;
      status.textContent = "一部の接続情報だけ表示しました。";
    } finally {
      refreshButton.disabled = false;
    }
  }
}
