import {
  createMessageId,
  formatTalkTimestamp,
  loadTalkMessages,
  saveTalkMessages,
  scrollTalkToBottom,
} from "../utils.js";

export function renderTalkTool() {
  const talkList = document.querySelector("#talk-list");
  const talkEmpty = document.querySelector("#talk-empty");
  const talkInput = document.querySelector("#talk-input");
  const sendButton = document.querySelector("#send-talk-message");
  const clearButton = document.querySelector("#clear-talk-messages");
  const status = document.querySelector("#talk-status");
  let messages = loadTalkMessages();

  renderMessages();

  sendButton.addEventListener("click", handleSend);
  clearButton.addEventListener("click", handleClear);
  talkInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  });

  function handleSend() {
    const text = talkInput.value.trim();
    if (!text) {
      status.textContent = "空のメッセージは送信できません。";
      talkInput.focus();
      return;
    }

    messages.push({
      id: createMessageId(),
      text,
      createdAt: new Date().toISOString(),
    });
    saveTalkMessages(messages);
    talkInput.value = "";
    renderMessages();
    scrollTalkToBottom(talkList);
    status.textContent = "メッセージを保存しました。";
    talkInput.focus();
  }

  function handleClear() {
    if (!messages.length) {
      status.textContent = "削除するメッセージはありません。";
      return;
    }

    if (!window.confirm("保存済みのメッセージをすべて削除しますか？")) {
      return;
    }

    messages = [];
    saveTalkMessages(messages);
    renderMessages();
    status.textContent = "メッセージをすべて削除しました。";
  }

  function handleDelete(id) {
    messages = messages.filter((message) => message.id !== id);
    saveTalkMessages(messages);
    renderMessages();
    status.textContent = "メッセージを削除しました。";
  }

  function renderMessages() {
    talkList.innerHTML = "";
    talkEmpty.hidden = messages.length > 0;
    clearButton.disabled = messages.length === 0;

    messages.forEach((message) => {
      const item = document.createElement("article");
      const bubble = document.createElement("div");
      const meta = document.createElement("div");
      const deleteButton = document.createElement("button");

      item.className = "talk-message";
      bubble.className = "talk-bubble";
      meta.className = "talk-meta";
      bubble.textContent = message.text;

      deleteButton.type = "button";
      deleteButton.className = "talk-delete";
      deleteButton.textContent = "削除";
      deleteButton.addEventListener("click", () => handleDelete(message.id));

      meta.textContent = formatTalkTimestamp(message.createdAt);
      meta.append(deleteButton);
      item.append(bubble, meta);
      talkList.append(item);
    });
  }
}
