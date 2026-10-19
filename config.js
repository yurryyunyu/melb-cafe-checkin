// ===================== 配置 / CONFIG =====================
// 所有外部服务的 key 都只在这里配置。全部留空时 app 依然可用（自动降级）。
window.APP_CONFIG = {
  // ---- Google 地图 ----
  // 需要在 Google Cloud 启用：Maps JavaScript API + Places API (New)，并给 key 加 HTTP referrer 限制（只允许你的网站域名）。
  // 留空 => 使用 OpenStreetMap/CARTO 地图 + 浏览器定位。
  GOOGLE_MAPS_API_KEY: '',
  // 可选：Google Cloud 控制台里创建的 Map ID（云端地图样式）。留空则使用内置的游戏风格 JSON 样式。
  GOOGLE_MAP_ID: '',

  // ---- 照片识别饮品/食物（任何 OpenAI 兼容的 vision chat-completions 接口）----
  // 例：ENDPOINT: 'https://api.openai.com/v1/chat/completions', MODEL: 'gpt-4o-mini'
  // ⚠️ 写在前端的 API_KEY 任何人都能看到，正式上线请换成你自己的后端代理地址，API_KEY 留空。
  // 留空 => 显示该店菜单让用户一键选择。
  VISION_API: { ENDPOINT: '', API_KEY: '', MODEL: 'gpt-4o-mini', TIMEOUT_MS: 15000 },

  // ---- 提交到 Google 表单 ----
  // FORM_ID：表单「发送 → 链接」得到 https://docs.google.com/forms/d/e/<FORM_ID>/viewform 中间那段。
  // ENTRY：每个字段对应的 entry.<数字>（表单右上角 ⋮ → 获取预填链接 → 填好后复制链接即可看到）。
  // 建议表单题目（全部用「简答」题型）：咖啡馆 / 区域 / 点的东西 / 总评分 / 口味 / 颜值 / 性价比 / 心得 / 日期
  // 留空 FORM_ID => 不提交，只保存在手机本地。照片不会上传。
  GOOGLE_FORM: {
    FORM_ID: '',
    ENTRY: {
      cafe: 'entry.1000000001',
      suburb: 'entry.1000000002',
      item: 'entry.1000000003',
      rating: 'entry.1000000004',
      taste: 'entry.1000000005',
      look: 'entry.1000000006',
      value: 'entry.1000000007',
      note: 'entry.1000000008',
      date: 'entry.1000000009'
    }
  }
};
