# Browser Test Patterns

- Initial state: Open the site root and confirm the default route is the stock tool with the stock code input visible.
- Markdown conversion: Switch to the Excel→Markdown tool, paste a fixed 2-column sample table, convert it, and confirm Markdown text is generated.
- Network info: Switch to the connection info tool, wait for the loading state to finish, and confirm export text is generated.
- Talk tool: Switch to the talk tool, post a fixed sample message, and confirm the message bubble is rendered and persisted in the UI.
- Base64 tool: Switch to the Base64 tool, encode a fixed UTF-8 string, then decode it back and confirm the original text is restored.
- Clipboard tool: Switch to the clipboard tool, save two fixed strings, reorder them by drag and drop, and confirm the order changes.
- Stock request handling: Return to the stock tool, submit Toyota stock code `7203`, wait for loading to finish, and capture the resulting status, table state, and Excel export text.

## Captured States

- `01-stock-initial.png`: Default stock tool screen before interaction.
- `02-markdown-ready.png`: Markdown tool after conversion output is populated.
- `03-network-info.png`: Connection info tool after IP and browser details are populated.
- `04-talk-ready.png`: Talk tool after posting a sample message bubble.
- `05-base64-ready.png`: Base64 tool after UTF-8 text has been encoded and decoded.
- `06-clipboard-ready.png`: Clipboard tool after two saved items are reordered.
- `07-stock-result.png`: Stock tool after the fetch attempt resolves and the status is visible.
