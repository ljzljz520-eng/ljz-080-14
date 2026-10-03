# 社区养老协作平台 · 慢病药盒管理

面向社区养老场景的协作平台，本期实现**慢病药盒管理**功能：管家登记长期用药、系统智能提醒补药、护工上门拍照核查、家属协同反馈。

## 角色与功能

| 角色 | 端 | 功能 |
| --- | --- | --- |
| 管家 | 管理端（PC） | 为老人登记高血压、糖尿病等长期用药（药品、用法、药盒容量/余量、复诊日期、家属代买习惯） |
| 系统 | 后端规则引擎 | 按**药盒余量**（余量天数 ≤ 代买提前期+缓冲）、**复诊日期**（7 天内/已过期）、**家属代买习惯**（临近平均购买周期）三条规则自动生成补药提醒 |
| 护工 | 管理端（PC） | 上门拍照确认药盒状态、清点余量；发现**漏服/混药**时自动生成健康观察记录 |
| 家属 | 家属端（H5） | 查看补药提醒、护工上门照片与下一步建议，一键反馈“已购买” |

> **隐私边界**：家属端不出现任何医疗诊断结论（慢病标签、内部医学描述、异常类型明细均由服务端聚合接口过滤），仅展示提醒、照片和下一步建议。

## Tech Stack

- **Frontend**: React 18+, TypeScript, Vite, React Router, antd（PC 管理端）, antd-mobile（H5 家属端）, LESS
- **Backend**: Node.js 20+, NestJS, TypeScript（内存数据仓库，可替换 Supabase Postgres）
- **Database**: Supabase Postgres (Dockerized)

## Project Structure

```
apps/
  client/                      # React 前端（双入口）
    src/admin/                 # 管理端（PC）：工作台 / 老人与用药 / 上门核查 / 健康观察
    src/family/                # 家属端（H5）：用药概览 / 补药提醒 / 上门动态
  server/                      # NestJS 后端
    src/modules/elders/        # 老人与用药计划
    src/modules/medications/   # 管家用药登记
    src/modules/reminders/     # 补药提醒规则引擎
    src/modules/checks/        # 护工上门核查（拍照）
    src/modules/observations/  # 健康观察记录
    src/modules/family/        # 家属端聚合视图（脱敏）
```

## How to Run

```bash
docker compose up          # 一键启动（前端 3000 / 后端 8000 / 数据库 5432）
```

本地开发：

```bash
npm install
npm run start:dev --workspace server   # 后端 http://localhost:3000（/api 前缀）
npm run dev --workspace client         # 前端 http://localhost:5173
```

## 页面入口

- `/` 入口选择页
- `/admin` 管理端（PC）：工作台 → 老人与用药 → 上门药盒核查 → 健康观察记录
- `/family` 家属端（H5）：用药概览 / 补药提醒 / 上门动态

## 核心 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/elders` / `/api/elders/:id` | 老人列表/详情（含用药计划与消耗概览） |
| POST | `/api/medications` | 管家登记长期用药 |
| GET | `/api/reminders` | 补药提醒列表（规则引擎实时生成） |
| PATCH | `/api/reminders/:id/status` | 更新提醒状态（done 时回写药盒余量） |
| POST | `/api/checks` | 护工提交核查（拍照）；漏服/混药自动生成健康观察记录 |
| GET | `/api/observations` | 健康观察记录（管理端内部视图） |
| GET | `/api/family/:elderId/overview` | 家属端聚合视图（已脱敏） |
| POST | `/api/family/reminders/:id/done` | 家属反馈“已购买” |

## 测试

```bash
npm run test --workspace server        # 单元测试（提醒规则 / 隐私边界 / 核查联动）
npm run test:e2e --workspace server    # 端到端测试
```
