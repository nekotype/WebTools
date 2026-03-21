# Browser Test Patterns

- Initial state: Open the site root and confirm the default route is the stock tool with the stock code input visible.
- Markdown conversion: Switch to the Excel→Markdown tool, paste a fixed 2-column sample table, convert it, and confirm Markdown text is generated.
- Stock request handling: Return to the stock tool, submit Toyota stock code `7203`, wait for loading to finish, and capture the resulting status, table state, and Excel export text.

## Captured States

- `01-stock-initial.png`: Default stock tool screen before interaction.
- `02-markdown-ready.png`: Markdown tool after conversion output is populated.
- `03-stock-result.png`: Stock tool after the fetch attempt resolves and the status is visible.
