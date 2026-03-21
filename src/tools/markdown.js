import { convertExcelTextToMarkdown, copyText } from "../utils.js";

export function renderMarkdownTool() {
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
