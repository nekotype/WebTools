import {
  copyText,
  createMessageId,
  formatTalkTimestamp,
  loadClipboardItems,
  reorderItems,
  saveClipboardItems,
} from "../utils.js";

export function renderClipboardTool() {
  const input = document.querySelector("#clipboard-input");
  const saveButton = document.querySelector("#save-clipboard-item");
  const clearButton = document.querySelector("#clear-clipboard-items");
  const status = document.querySelector("#clipboard-status");
  const list = document.querySelector("#clipboard-list");
  const empty = document.querySelector("#clipboard-empty");
  let items = loadClipboardItems();
  let dragItemId = "";

  renderItems();

  saveButton.addEventListener("click", handleSave);
  clearButton.addEventListener("click", handleClear);

  function handleSave() {
    const text = input.value.trim();
    if (!text) {
      status.textContent = "空の文字列は保存できません。";
      input.focus();
      return;
    }

    items.push({
      id: createMessageId(),
      text,
      createdAt: new Date().toISOString(),
    });
    saveClipboardItems(items);
    input.value = "";
    renderItems();
    status.textContent = "コピペ帳へ保存しました。";
    input.focus();
  }

  function handleClear() {
    if (!items.length) {
      status.textContent = "削除する項目はありません。";
      return;
    }

    if (!window.confirm("保存済みのコピペ項目をすべて削除しますか？")) {
      return;
    }

    items = [];
    saveClipboardItems(items);
    renderItems();
    status.textContent = "コピペ帳を全クリアしました。";
  }

  function handleDelete(id) {
    items = items.filter((item) => item.id !== id);
    saveClipboardItems(items);
    renderItems();
    status.textContent = "項目を削除しました。";
  }

  async function handleCopy(text) {
    await copyText(text);
    status.textContent = "クリップボードへコピーしました。";
  }

  function handleDrop(targetId) {
    if (!dragItemId || dragItemId === targetId) {
      return;
    }
    items = reorderItems(items, dragItemId, targetId);
    saveClipboardItems(items);
    renderItems();
    status.textContent = "並び順を更新しました。";
    dragItemId = "";
  }

  function renderItems() {
    list.innerHTML = "";
    empty.hidden = items.length > 0;
    clearButton.disabled = items.length === 0;

    items.forEach((item) => {
      const card = document.createElement("article");
      const text = document.createElement("div");
      const meta = document.createElement("div");
      const copyButton = document.createElement("button");
      const deleteButton = document.createElement("button");
      const handle = document.createElement("span");

      card.className = "clipboard-card";
      card.draggable = true;
      card.dataset.itemId = item.id;
      card.addEventListener("dragstart", () => {
        dragItemId = item.id;
        card.classList.add("is-dragging");
      });
      card.addEventListener("dragend", () => {
        dragItemId = "";
        card.classList.remove("is-dragging");
      });
      card.addEventListener("dragover", (event) => {
        event.preventDefault();
        card.classList.add("is-drop-target");
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("is-drop-target");
      });
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("is-drop-target");
        handleDrop(item.id);
      });

      handle.className = "clipboard-handle";
      handle.textContent = ":::";

      text.className = "clipboard-text";
      text.textContent = item.text;

      meta.className = "clipboard-meta";
      meta.textContent = formatTalkTimestamp(item.createdAt);

      copyButton.type = "button";
      copyButton.className = "secondary-button";
      copyButton.textContent = "コピー";
      copyButton.addEventListener("click", () => handleCopy(item.text));

      deleteButton.type = "button";
      deleteButton.className = "clipboard-delete";
      deleteButton.textContent = "削除";
      deleteButton.addEventListener("click", () => handleDelete(item.id));

      meta.append(copyButton, deleteButton);
      card.append(handle, text, meta);
      list.append(card);
    });
  }
}
