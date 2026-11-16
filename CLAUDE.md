# 鬧鬼寵物待辦（簡化版）

做完任務餵飽幽靈寵物；逾期任務會生出殭屍吸血，HP 歸零變墓碑，再孵新蛋。
由 `haunted-pet-todo`（Next.js + Supabase 版）簡化而來：純前端、無後端、只有繁體中文。

## 技術棧
- Vite + React 19 + TypeScript，套件管理用 npm
- 純 CSS（`src/styles.css`），不用 Tailwind 或動畫套件
- 資料存 localStorage，key 為 `haunted-pet-lite:v1`
- 測試：Vitest

## 常用指令
- 開發：`npm run dev`（http://localhost:5173）
- 測試：`npm test`
- 型別檢查：`npm run typecheck`
- 建置：`npm run build`（會先跑型別檢查）

## 結構
- `src/game/`：遊戲規則，全是純函式。`engine.ts` 是核心，`constants.ts` 放所有數值
- `src/useGame.ts`：唯一的狀態入口，負責補算時間、存檔、播音效
- `src/components/`：純顯示元件，不放遊戲規則
- `public/sprites`、`public/sfx`：沿用原版素材

## 規則
- `src/game/` 裡不准呼叫 `Date.now()` 或 `new Date()` 取現在時間，一律由參數傳入 `now`。
  （`new Date(ts)` 用來換算已知時間戳是可以的。）快轉和測試都依賴這點
- 遊戲時間 = `Date.now() + clockOffsetMs`，只在 `useGame.ts` 計算
- 衰減是依時間差一次補算（`catchUp`），不是靠計時器累加；分次補算和一次補算結果要相同
- 改遊戲規則時同步更新 `engine.test.ts`，完成前跑 `npm test` 和 `npm run typecheck`
- 改動存檔格式時要把 `version` 加一，並在 `storage.ts` 處理舊資料
- 介面文字直接寫繁體中文，不要加 i18n
- 音效預設靜音

## 刻意不做的（原版有，簡化版拿掉）
AI 墓誌銘與任務拆解、Supabase、推播、Cron、子任務、拖曳排序、任務大小、英文介面。
要加回來之前先問。
