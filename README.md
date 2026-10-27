# 墨尔本咖啡打卡 · Melbourne Cafe Check-in

A cozy town-building game for checking in to 101 real Melbourne cafes: photo check-ins, a 3D village map, villager baristas, quests, a coin shop, a bean collection, an Australian festival calendar, a coffee-education main story and Google review links. Five themes: 🏰 城镇 (default), 🐄 牧场, pixel valley, JRPG and hand-drawn sketch.

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

## 🎨 Themes (设置 → 界面主题)
All themes share one save: check-ins, coins, XP, stamina, quests, beans and friendship are kept when you switch.
- **🏰 城镇 / Town (default, `foundation`)**: a medieval-village look with painterly low-poly 3D, a warm pastoral palette, golden light, parchment-and-wood panels, serif headings and system-font body text (no web fonts). Each cafe is a little cottage: a dashed blue blueprint until you check in, then a built house. On the cafe page the house raises a flag after 5 check-ins. The HUD is a resource bar (coins, Lv/XP, buildings built, season·day·weather·time) with stamina underneath. The 3D map (three.js, vendored) shows winding dirt roads, orchards and wheat fields, seasonal meadow colours, a tilt-shift blur at the top and bottom, and building markers. If WebGL is missing, the map uses the 2D sketch map instead. On a slow device (median frame over 60 ms in a 12-frame probe) it switches to 2D automatically, and you can try 3D again later. Music is an optional procedural plucked "lute" tune for day and night (original, off by default).
- **🐄 牧场 / Ranch (`ranch`)**: a bright, chunky farm-life skin on the pixel valley engine. It has a date board with weekday, day, season·day, time and in-game weather, a rucksack tool bar (日历/种子袋/日记/背包/杂货店), friendship hearts with villager baristas that rise with repeat check-ins, a dialogue box with a name ribbon, and seasonal town tiles (spring blossom, summer green, autumn orange, frosty winter). On rainy days it rains, and bunting goes up on festival days. Four original seasonal chiptune variants (off by default).
- The pixel valley, JRPG and sketch themes are unchanged and still selectable. All art and music is original and drawn in code; no sprites, logos, names or melodies from any commercial game.

## 📅 Season calendar & Australian festivals (festivals.js, `#/calendar`)
Seasons follow the southern hemisphere: spring Sep–Nov, summer Dec–Feb, autumn Mar–May, winter Jun–Aug. In-game weather is deterministic per date and season and labelled as in-game, not a real forecast. Festival days show a banner, villagers say festival lines, and a 4th daily quest (check in on the festival day) pays 80 coins (+40 XP).
Victorian public holidays are computed from the rules in the Public Holidays Act, as published by Business Victoria (tests compare 2025–2027 against the official tables):
New Year's Day (1 Jan, plus the next Monday if it falls on a weekend) · Australia Day (26 Jan, moved to the next Monday if it falls on a weekend) · Labour Day (2nd Monday of March) · Good Friday, Easter Saturday, Sunday and Monday (Meeus/Jones/Butcher Easter algorithm) · ANZAC Day (25 Apr, no substitute) · King's Birthday (2nd Monday of June) · Friday before the AFL Grand Final (announced dates for 2022–2026; other years show the last Friday of September marked 约) · Melbourne Cup Day (1st Tuesday of November; some regional councils substitute a local holiday) · Christmas and Boxing Day with the VIC substitute days.
Events (not public holidays): Lunar New Year (published dates for 2021–2031 only), Moomba (2026: 5–9 Mar per City of Melbourne; other years approximated as the Labour Day long weekend, marked 约), and Melbourne International Coffee Expo (2027: 4–6 Mar, MCEC). Events without verified dates are left out.
Tests: `/workspace/pwtest/testfest.mjs` (dates + calendar UI) and `testthemes.mjs` (both themes, 3D→2D fallback, progress kept).

## 📖 咖啡课 / Coffee course (edu.js, `#/edu`)
This is a course in 8 chapters, taught by the mentor villager 老焙. It takes you from 咖啡小白 through 识豆学徒 → 处理法见习生 → 烘焙观察员 → 萃取学徒 → 奶咖手艺人 → 手冲练习生 → 杯测品鉴师 to 咖啡大师. The chapters cover origins & varieties, processing, roasting, espresso extraction, milk & latte-art basics, filter/pour-over, tasting & cupping, and Melbourne coffee culture.
- Each chapter has a short dialogue lesson with class notes, then 2–3 tasks, then a 4-question quiz. Pass with 3/4 to rank up, and retry as often as you like (the options reshuffle each time).
- Tasks are checked only against data the app already stores: check-in drink names (Long Black / Flat White / Filter …), ratings, photos and notes, bean fields (origin, process, roast), cafe tags (烘焙商, 手冲) and the researched signatures. Homebody Union and the other filter cafes are suggested as targets. Past check-ins count.
- Rewards are coins and XP through the existing quest ledger, plus cosmetics in the pixel shop: 手摇磨豆机 (ch 3), 杯测白袍 (ch 7) and 咖啡学士帽 (ch 8). Progress is saved in `localStorage['mcc.edu']`.
- The lessons are original Simplified Chinese, checked against SCA (cupping protocol, Golden Cup, flavor wheel), World Coffee Research, roaster and barista education pages, and Melbourne history sources. Tests: `/workspace/pwtest/testedu.mjs`.

## 📜 主线剧情「第一颗豆」 / Main story (story.js, story.css, `#/story`)
An original, Simplified-Chinese story that ties the check-ins, the coffee course and the bean notes together: a newcomer to Melbourne meets the retired roaster 老焙, who has lost a recipe-and-memory book that was torn into pages and hidden in cafes around the city. Prologue + 9 chapters + epilogue.
- Each chapter has an opening cutscene, 2–4 objectives and a closing cutscene with coins / XP, a title and (ch 5 and ch 9) a cosmetic. Objectives are area / count based (distinct cafes in MEL CITY, RICHMOND, NORTH MEL, BRUNSWICK or the 更多 suburbs, course chapters, bean notes, ratings, photos, level) and never name one specific cafe. Existing check-ins count retroactively; progress is saved in `localStorage['mcc.story']`, rewards go through the normal quest ledger.
- Cutscenes auto-play when a chapter unlocks or completes (tap to advance, 跳过 to skip, all replayable from the 主线 page) and use each theme's own dialog skin; the 古风 theme uses painted portraits and silk-frame dialogs. Hidden characters may cameo only after the player has already met them.
- Under browser automation (`navigator.webdriver`) cutscenes stay off unless the URL has `?story` or `localStorage['mcc.storyTest']` is set. Tests: `/workspace/pwtest/teststory.mjs`.

## 🎭 隐藏角色 / Hidden NPCs (npc.js, `#/npc`)
The town has 10 original hidden characters who only appear when a condition is met:
- **Easy:** tap the title 5 times; open the closed Hash Specialty Coffee page; check in on an in-game rainy day.
- **Depends on timing:** check in between 04:00 and 07:00 Melbourne time; open the app on a Victorian holiday or festival day; run your stamina down to 0.
- **Long-term:** check in 5 days in a row; collect beans with 3 different processes; check in 10 times at one cafe; finish the coffee course.

Each character has their own dialogue, which opens as an encounter. You get coins and XP through the quest ledger. The festival guest and the old barista also give unique cosmetics for the pixel shop.

The codex (图鉴) shows unmet characters as `?` silhouettes with vague hints. Conditions based on stored data count past records. Stamina 0, the title tap and the Hash page only count at the time they happen.

Progress is stored in localStorage under `mcc.npc`. Tests: `/workspace/pwtest/testnpc.mjs`. Under automation, encounters stay off unless `?npc` or `mcc.npcTest` is set.

## 🎓 SCA 问答 / SCA quiz (sca.js, `#/sca`)

首页和「咖啡课」页都有入口 `#/sca`。题目按 SCA 咖啡技能课程（Coffee Skills Program）分为初级 Foundation 和中级 Intermediate：

- **题量：** 共 182 道原创练习题，每个模块 16–17 题。Introduction to Coffee 只有初级，SCA 没有设中级。
- **练习：** 答完马上看解析和出处，答错的题自动进错题本。
- **模考：** 随机抽 10 题（或整个模块），可以选择计时，每题 60 秒，时间到自动交卷。也有本级综合模考（20 / 30 题）。
- **奖励：** 某个模块的模考（至少 10 题）第一次达到 80%，就算「已掌握」，奖励 🪙40（初级）或 🪙60（中级），外加一半的 XP。每个模块只发一次，总共最多 🪙540。
- **存储：** 进度存在 `localStorage` 的 `mcc.sca` 里。

> **非 SCA 官方题库，仅供练习。** 题目依据 SCA 公开的课纲、Coffee Standards、Protocols & Best Practices，以及 World Coffee Research、ISO 4120 和同行评审文献的综述写成，不是考试真题，也不代表 SCA 认可。SCA 在 2024 年改用 CVA 杯测标准，所以涉及 2004 版杯测表的题都标明了版本。题库在 `sca.js`。

## 🌐 官网 / Instagram links (websites.js)
Each cafe page has a **官网** button, or **Instagram** when the cafe has no official site, and each card shows a small globe or Instagram icon. Links open in a new tab with `rel=noopener`. The links come from `research/websites.json`, where every URL was fetched and checked to name the venue. Multi-venue brands link to the location page where one exists. There are 99 links: 89 websites and 10 Instagram accounts. Two cafes have no verified link, so no button is shown: Hash Specialty Coffee (closed) and Reunion and Co (the site doesn't load). Tests: `/workspace/pwtest/testweb.mjs`.

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
