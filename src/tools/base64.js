import { copyText, decodeBase64Text, encodeBase64Text } from "../utils.js";

export function renderBase64Tool() {
  const input = document.querySelector("#base64-input");
  const output = document.querySelector("#base64-output");
  const status = document.querySelector("#base64-status");
  const encodeButton = document.querySelector("#encode-base64");
  const decodeButton = document.querySelector("#decode-base64");
  const copyButton = document.querySelector("#copy-base64-output");

  encodeButton.addEventListener("click", () => {
    const value = input.value;
    if (!value.trim()) {
      output.value = "";
      copyButton.disabled = true;
      status.textContent = "変換したい文字列を入力してください。";
      return;
    }

    output.value = encodeBase64Text(value);
    copyButton.disabled = false;
    status.textContent = "Base64 へエンコードしました。";
  });

  decodeButton.addEventListener("click", () => {
    const value = input.value;
    if (!value.trim()) {
      output.value = "";
      copyButton.disabled = true;
      status.textContent = "デコードしたい Base64 を入力してください。";
      return;
    }

    try {
      output.value = decodeBase64Text(value);
      copyButton.disabled = false;
      status.textContent = "Base64 をデコードしました。";
    } catch (error) {
      output.value = "";
      copyButton.disabled = true;
      status.textContent = "Base64 の形式が正しくありません。";
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!output.value) {
      return;
    }
    await copyText(output.value);
    status.textContent = "変換結果をコピーしました。";
  });
}
