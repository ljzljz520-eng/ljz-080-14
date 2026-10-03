# 社区养老协作平台 · 慢病药盒管理

在原有 React + NestJS 空项目骨架上，新增 **慢病药盒管理** 协作闭环：

- **管家（PC 管理端）**：为老人登记高血压、糖尿病等长期用药（药品、剂量、药盒余量、复诊日期、家属代买习惯）；系统按 **药盒余量 + 复诊日期 + 家属代买习惯** 自动生成补药提醒并支持回写余量；查看护工核查后生成的健康观察记录。
- **护工（H5）**：上门名单 → 拍照确认药盒 → 逐盒核对（正常 / 疑似漏服 / 疑似混药 / 余量不符）并清点余量；提交后**漏服、混药自动生成健康观察记录**，余量以现场清点为准回写。
- **家属（H5）**：只展示 **补药提醒、上门照片、下一步建议**；不出现慢病分类、观察类型或任何医疗诊断结论（后端 `/api/family/*` 统一做安全视图与越权校验）。

## 技术栈

- 前端：React 19 + TypeScript + Vite，React Router，antd（PC）/ antd-mobile（H5），LESS
- 后端：NestJS 11 + TypeScript；数据模型对应 Supabase 表（`apps/server/supabase/schema.sql`），演示用内存仓储 `StoreService`，接口形状不变即可切换 Supabase
- 三入口构建：`pc.html`（管家）、`h5.html`（护工/家属）、`index.html`（双端联调）

## 本地运行

```bash
npm install

# 后端
cd apps/server && npm run start:dev        # http://localhost:3000/api

# 前端（另一终端，已配置 /api 代理到 8000；本地开发直连 3000 时见下）
cd apps/client && npm run dev               # http://localhost:3000
```

演示身份可在 H5 右上角「切换身份」：护工李护工/赵护工，或家属周建国（儿子）、刘敏（孙女）、孙伟（女婿）。

> 前端 dev server 默认占用 3000，与后端冲突时可用 `npm run dev -- --port 5173`，
> 并将 `vite.config.ts` 代理 target 改为 `http://localhost:3000`。

## Docker

```bash
docker compose up   # 前端 http://localhost:3000  后端 http://localhost:8000
```

## 验证

```bash
cd apps/server && npm test     # 提醒引擎 & 观察记录生成单测（10 个）
cd apps/client && npm run build
```

## 目录

```
apps/
  client/src/
    pc/        # 管家管理端（补药提醒看板 / 老人用药档案 / 健康观察记录）
    h5/        # 移动门户（护工上门核查 + 家属安全视图）
    shared/    # API 客户端与类型
  server/src/
    reminders/     # 补药提醒引擎（余量 × 复诊 × 代买习惯）
    meds/ elders/  # 管家登记长期用药
    media/         # 护工拍照
    checks/        # 上门核查（拍照确认 + 逐盒状态）
    observations/  # 漏服/混药健康观察记录
    family/        # 家属端安全视图（隐私边界）
    database/      # 内存仓储 + 种子数据（对应 Supabase 表）
```
