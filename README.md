# 🐾 宠物店智能管理系统

帮助宠物店管理猫狗洗澡、美容、寄养等业务，减少人工记录，提高预约管理效率。

## 技术栈

| 层面   | 技术                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- |
| 前端   | React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui · React Router 7 · TanStack Query · Zustand |
| 后端   | Express 5 · TypeScript · Prisma 6                                                                     |
| 数据库 | SQLite（开发）· MySQL（生产）                                                                         |
| 工程化 | Prettier · Husky · lint-staged · Oxlint · EditorConfig                                                |

## 快速开始

```bash
# 1. 克隆项目
git clone <repo-url> && cd 宠物店小网站

# 2. 安装依赖（根目录 + 所有 workspace）
npm install

# 3. 初始化数据库
npm run db:push        # 同步 Schema 到数据库
npm run db:seed        # 填充演示数据

# 4. 启动开发服务
npm run dev            # 同时启动前后端
# 或分别启动：
npm run dev:server     # 后端 → http://localhost:3001
npm run dev:client     # 前端 → http://localhost:5173
```

## 常用命令

| 命令                 | 说明                                |
| -------------------- | ----------------------------------- |
| `npm run dev`        | 同时启动前端和后端开发服务          |
| `npm run dev:server` | 仅启动后端                          |
| `npm run dev:client` | 仅启动前端                          |
| `npm run build`      | 构建生产版本                        |
| `npm run lint`       | 代码检查（前端 oxlint + 后端 tsc）  |
| `npm run format`     | 格式化所有代码                      |
| `npm run typecheck`  | TypeScript 类型检查（全量）         |
| `npm run db:studio`  | 打开 Prisma Studio 可视化管理数据库 |
| `npm run db:migrate` | 数据库迁移（Schema 变更后使用）     |
| `npm run db:seed`    | 重新填充演示数据                    |

## 项目结构

```
├── client/                  # 前端 React SPA
│   ├── src/
│   │   ├── components/      # UI 组件（ui/ layout/ shared/）
│   │   ├── pages/           # 页面组件（按路由分组）
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── lib/             # 工具函数、API 客户端
│   │   └── types/           # TypeScript 类型定义
│   └── package.json
├── server/                  # 后端 Express API
│   ├── src/
│   │   ├── config/          # 环境变量
│   │   ├── constants/       # 枚举、错误码
│   │   ├── controllers/     # 路由处理器
│   │   ├── services/        # 业务逻辑层
│   │   ├── repositories/    # 数据访问层
│   │   ├── middleware/       # Express 中间件
│   │   ├── routes/          # 路由注册
│   │   ├── lib/             # Prisma 客户端等
│   │   ├── utils/           # AppError、统一响应
│   │   └── types/           # 类型定义
│   ├── prisma/
│   │   ├── schema.prisma    # 数据模型（15 张表）
│   │   └── seed.ts          # 种子数据
│   └── package.json
├── .husky/                  # Git Hooks
├── .editorconfig            # 编辑器配置
├── .prettierrc              # 格式化配置
└── package.json             # 根 workspace 配置
```

## 数据库

### 数据模型（15 张表）

| 表                 | 用途          |
| ------------------ | ------------- |
| `staff`            | 员工信息      |
| `customer`         | 客户（主人）  |
| `pet`              | 宠物档案      |
| `pet_note`         | 宠物备注/标签 |
| `service`          | 服务项目      |
| `appointment`      | 预约单        |
| `appointment_item` | 预约服务明细  |
| `payment`          | 支付记录      |
| `boarding`         | 寄养记录      |
| `care_log`         | 看护日志      |
| `membership_card`  | 会员卡        |
| `card_transaction` | 卡消费记录    |
| `product`          | 商品库存      |
| `inventory_log`    | 库存流水      |
| `schedule`         | 员工排班      |

### 演示账号（密码均为 `123456`）

| 角色   | 姓名   | 手机号      |
| ------ | ------ | ----------- |
| 老板   | 王建国 | 13800000001 |
| 美容师 | 小张   | 13800000002 |
| 美容师 | 小李   | 13800000003 |
| 前台   | 小陈   | 13800000004 |

## 开发约定

- **API 响应格式**：统一 `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- **数据库命名**：snake_case 列名 + `@map()` 映射，Prisma 模型使用 PascalCase
- **枚举值**：所有魔法字符串在 `server/src/constants/enums.ts` 中定义
- **错误码**：统一在 `server/src/constants/error-codes.ts` 中管理
- **文件命名**：kebab-case 文件名，PascalCase 组件名
- **Git 提交**：lint-staged 自动格式化所有提交的文件

## 版本规划

| 版本   | 范围                                                  |
| ------ | ----------------------------------------------------- |
| 🟢 MVP | 登录 · 工作台 · 客户管理 · 宠物档案 · 预约管理 · 收银 |
| 🔵 V2  | 寄养管理 · 数据报表 · 会员卡 · 库存管理 · 消息通知    |
| ⚪ V3  | 排班管理 · 客户小程序 · 优惠券 · 多店连锁             |
