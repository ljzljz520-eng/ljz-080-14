# 社区养老协作平台 · 后端（NestJS）

## 运行

```bash
npm install
npm run start:dev   # http://localhost:3000
```

## 角色

通过请求头模拟身份（生产环境替换为 Supabase Auth / JWT 守卫）：

- `x-user-role: manager` 管家（PC 端）
- `x-user-role: caregiver` + `x-user-id: c1` 护工（H5）
- `x-user-role: family` + `x-user-id: f1` 家属（H5）

## 慢病药盒管理 API

| 方法 & 路径 | 角色 | 说明 |
| --- | --- | --- |
| `GET /api/reminders` | 管家 | 按「药盒余量 + 复诊日期 + 家属代买习惯」汇总补药提醒 |
| `GET /api/reminders/by-elder?elderId=` | 管家 | 单老人药盒评估（含正常项） |
| `GET/POST /api/meds`、`PUT /api/meds/:id` | 管家写 | 登记/编辑高血压、糖尿病等长期用药 |
| `PATCH /api/meds/:id/stock` | 管家/护工 | 补药后回写药盒余量 |
| `POST /api/media/photos` | 护工 | 上门拍照（dataURL，生产替换为 Supabase Storage） |
| `POST /api/checks` | 护工 | 逐盒核查；疑似漏服/混药自动生成健康观察记录并回写实收余量 |
| `GET /api/checks` | 内部 | 核查记录（含照片） |
| `GET /api/observations` | 内部 | 健康观察记录（含观察详情，仅管家/护工） |
| `PATCH /api/observations/:id/ack` | 管家 | 标记跟进 |
| `GET /api/family/elders` | 家属 | 关联老人及待办数 |
| `GET /api/family/elders/:id/reminders` | 家属 | 补药提醒安全视图 |
| `GET /api/family/elders/:id/observations` | 家属 | 仅中性标题 + 下一步建议 + 照片 |
| `GET /api/family/elders/:id/photos` | 家属 | 护工上门照片时间线 |

## 隐私边界

家属端接口（`/api/family/*`）**不返回**慢病分类（`category`）、观察类型
（`type`）、观察详情（`content`）及任何诊断性措辞；统一转写为
「服药提醒关注 / 药盒需要整理 / 药盒数量已核对」+ 非诊断性下一步建议。

## 提醒计算规则

1. **余量**：`stockDoses / dosesPerDay` 得可服天数，低于 `thresholdDays` 预警；
   ≤2 天为紧急。
2. **复诊**：复诊前 7 天提示备药；当天提示请医生开下一周期用药。
3. **代买习惯**：按家属渠道（家属代买/药房自购/线上下单）与习惯提前量
   `buyerLeadDays`，取「复诊日 − 提前量」与「断药日 − 提前量」中更早日期为
   最晚购药日；当天即提示「已到习惯下单时间」。
4. **建议补药量**：`(距复诊天数 + 28) × 每日剂量 − 当前余量`。

数据表结构见 `supabase/schema.sql`。
