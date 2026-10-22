# 墨尔本咖啡打卡 · Melbourne Cafe Check-in

A cozy pixel-art game for checking in to 101 real Melbourne cafes: photo check-ins, a pixel map of real streets, villager baristas, quests, a coin shop, a bean collection and Google review links.

**Play it:** https://yurryyunyu.github.io/melb-cafe-checkin/

<p>
<img src="docs/title.png" width="200" alt="Title screen">
<img src="docs/home.png" width="200" alt="Home with 101 cafes">
<img src="docs/detail.png" width="200" alt="Cafe detail">
</p>
<p>
<img src="docs/map.png" width="200" alt="Pixel real map">
<img src="docs/shop.png" width="300" alt="Coin shop">
<img src="docs/diary.png" width="200" alt="Diary">
</p>

## Developer notes
Static mobile web app, no backend; data in localStorage. Serve the folder with any static host (HTTPS needed for camera/geolocation on phones).
- config.js — the only place for keys: GOOGLE_MAPS_API_KEY (+ optional GOOGLE_MAP_ID), VISION_API, GOOGLE_FORM.
- Google APIs to enable for the key: Maps JavaScript API, Places API (New). Restrict the key by HTTP referrer — see **Google 评价 / Google reviews** below.
- Google Form: create short-answer questions 咖啡馆/区域/点的东西/总评分/口味/颜值/性价比/心得/日期, take FORM_ID from .../forms/d/e/<FORM_ID>/viewform and entry.<id>s from a pre-filled link.
- Menus in data.js are SAMPLE data, not verified.
Local test: python3 -m http.server 8787 ; tests: /workspace/pwtest/test.mjs
- 🫘 拍豆子 (beans.js): camera button → 打卡 / 拍豆子. Bag-label photo → on-device OCR with self-hosted Tesseract.js 7 (vendor/tesseract: worker + wasm core + eng / chi_sim best_int data; lazy-loaded on first use, cached by the SW on first use, never precached). 识别中文 toggle loads chi_sim only on demand. Fields parsed heuristically (roaster, origin, region, farm, variety, process, roast, roast date, altitude, notes, weight); if VISION_API.ENDPOINT is set the photo goes there for JSON extraction first, falling back to OCR. Saved in localStorage `mcc.beans`; list/search `#/beans`, detail `#/bean/<id>` with copy/share/edit/delete. If OCR fails to load, manual entry + 重新解析 still work.
- ❤️ 体力 / HP (stamina): max 100, each check-in on today's Melbourne date costs 20 (5 cafes empties it), floors at 0. Derived purely from check-in dates, so edits/deletes update it and it refills at Melbourne midnight (the valley day summary never refills). Drop animation (shake + red flash + floating -20 / JRPG "HP -20"), green→yellow→red; barista warns at ≤40, tired hero + "体力耗尽！明天再来吧" at 0; checking in at 0 still works and unlocks ⚡ 咖啡因过载 (no XP). Beans cost nothing.

## ⭐ Google 评价 / Google reviews (greviews.js)
**Without a key (default):** every cafe card and detail page has a **看 Google 评价** button. It opens Google Maps for that cafe using the official Maps URLs format: `https://www.google.com/maps/search/?api=1&query=<name, address>`, plus `&query_place_id=<id>` when a place id is known. No API key is needed, and no Google API is contacted. It works in every theme.

**With a key (optional):** set `GOOGLE_MAPS_API_KEY` in `config.js`. When a cafe detail page opens, and only then, the app lazy-loads the Maps JavaScript API with the Places library (Places API New). It finds the place (`Place.searchByText`, which returns the id only) and shows the Google star rating, the review count and up to 5 recent reviews in a pixel panel. The panel shows author names linked to their profiles, the relative time, a link to all reviews on Google Maps, and the "Google Maps" attribution. If the key is wrong, quota runs out or the network fails, the panel turns into a one-line note and the button keeps working.

**What gets stored:** only the Google `place_id` is stored long-term (`localStorage['mcc.gplace']`). The rating and review content is kept in `sessionStorage` for at most 30 minutes and is never written to localStorage. This follows Google's caching rules for Places content.

### How to create the key
1. In Google Cloud Console, create or select a project and enable billing. Places API (New) is billed per request after the free monthly credit.
2. Go to **APIs & Services → Library** and enable **Maps JavaScript API** and **Places API (New)**.
3. Go to **APIs & Services → Credentials**, then **Create credentials → API key**.
4. Edit the key and set **Application restrictions** to **Websites (HTTP referrers)**. Add `https://yurryyunyu.github.io/*` (add `http://localhost:8787/*` too if you want to test locally).
5. On the same key, set **API restrictions** to **Restrict key** and select only **Maps JavaScript API** and **Places API (New)**.
6. Optionally, set quotas or a budget alert under **APIs & Services → Places API (New) → Quotas** and in **Billing → Budgets**.
7. Paste the key into `config.js` → `GOOGLE_MAPS_API_KEY: '...'` and deploy.

⚠️ **The key is public.** This is a static site, so anyone can read the key in `config.js` from the browser. The referrer and API restrictions are what stop other sites from using your quota. Never add a key without them, and never put a server or secret key in `config.js`.

Tests: `/workspace/pwtest/testgreview.mjs`. It checks the button URLs, checks that no Google API requests happen when the key is empty, and renders the panel from a fake Places response. The mock is clearly labelled TEST DATA.

## License

MIT, see [LICENSE](LICENSE). Third-party libraries in `vendor/` (Leaflet, three.js, Tesseract.js, Fusion Pixel font, etc.) remain under their own licenses.
