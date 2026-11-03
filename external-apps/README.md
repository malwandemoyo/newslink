# Imported & Linked Open-Source Engines (`./external-apps/`)

Connected Newsroom imports and links these ready-made open-source repositories so you do not need to build OCR, Kanban, or Equipment Inventory engines from scratch:

1. **Planka (`./external-apps/planka`)** — [https://github.com/plankanban/planka](https://github.com/plankanban/planka)
   - **Role:** Real-time Cross-Newsroom Verification Kanban Board
   - **Linked Port:** `http://localhost:3001` (`docker compose up -d planka`)
2. **Homebox (`./external-apps/homebox`)** — [https://github.com/sysadminsmedia/homebox](https://github.com/sysadminsmedia/homebox)
   - **Role:** Serialized Camera, Drone, Audio & Studio Equipment Inventory & Check-Out
   - **Linked Port:** `http://localhost:3002` (`docker compose up -d homebox`)
3. **Paperless-ngx + Tesseract.js (`./external-apps/paperless-ngx` & `node_modules/tesseract.js`)** — [https://github.com/paperless-ngx/paperless-ngx](https://github.com/paperless-ngx/paperless-ngx)
   - **Role:** Free Open-Source OCR for Scanned PDFs & Photographed Receipts
   - **Linked Port:** `http://localhost:8000` (`docker compose up -d paperless-ngx`) and directly imported inside `src/app/api/documents/upload/route.ts` via `tesseract.js` v7.0.0.
4. **Open-WebUI + Ollama Google Gemma 3 (`docker-compose.yml`)** — [https://github.com/open-webui/open-webui](https://github.com/open-webui/open-webui)
   - **Role:** Google Small LLM (`gemma3:4b` / `gemini-2.5-flash-lite`) Grounded Document RAG
   - **Linked Port:** `http://localhost:8080` (`docker compose up -d open-webui ollama`) and wired into `src/app/api/ai/research/route.ts`.
