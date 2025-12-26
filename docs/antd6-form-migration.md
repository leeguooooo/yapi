# antd v6 表单迁移分工与待办

目标与原因：
- **必须迁到 antd v6**：依赖已是 antd@6，继续保留 v1-5 写法（`Form.create`、`getFieldDecorator`、`wrappedComponentRef`、`LegacyForm`）会导致表单收集异常、弹窗失效、类型冲突。
- **严禁临时兼容**：删除 LegacyForm 兼容层，后续不再接受 DOM 取值或旧 API 作为“应急”方案。
- 完成后删除 `client/components/LegacyForm/index.js`，全仓库只允许 v6 受控表单。

## 改造规则（必须遵守）
- 只用 antd v6：`Form.useForm` + `Form.Item`，动态字段用 `Form.List` 或受控 state。
- Modal/Drawer 用 `open`（如保留 `visible` 仅为兼容，不可依赖）。
- 移除 DOM 取值、回调式 `validator`，改 Promise/内置校验。
- 不得新增 `LegacyForm`、`Form.create`、`getFieldDecorator`、`wrappedComponentRef`。
- 每批改完跑 `pnpm build-client` + 对应功能冒烟。

## 分工与任务

### A：登录 / 注册 / 项目创建
- 已完成：`client/containers/Login/Login.js`、`client/containers/Login/Reg.js`（参考写法）。
- 待办：
  - `client/containers/AddProject/AddProject.js`：表单改 v6，项目创建流程冒烟（填写名称/分组/权限，成功跳转接口页）。

### B：项目设置相关
- `client/containers/Group/ProjectList/UpDateModal.js`：项目更新 Modal（环境列表增删、校验、保存）。
- `client/containers/Project/Setting/ProjectMessage.js`：项目通知/消息配置表单。
- `client/containers/Project/Setting/ProjectEnv/ProjectEnvContent.js`：环境列表增删改，校验域名、协议。
- `client/containers/Project/Setting/ProjectRequest/ProjectRequest.js`：请求参数/公共设置表单。
- `client/containers/Project/Setting/ProjectMock/index.js`：Mock 设置表单。
- 冒烟：修改项目名称/描述/环境，保存成功并刷新列表；Mock/请求配置可正常保存。

### C：接口 CRUD 表单
- `client/containers/Project/Interface/InterfaceList/AddInterfaceCatForm.js`：新增分类弹窗。
- `client/containers/Project/Interface/InterfaceList/AddInterfaceForm.js`：新增接口弹窗（路径、方法、标签、请求体等）。
- `client/containers/Project/Interface/InterfaceList/InterfaceEditForm.js`：接口编辑表单。
- 冒烟：创建分类/接口，编辑接口保存后列表/详情正常刷新。

### D：测试集合 / 公共兼容层
- `client/containers/Project/Interface/InterfaceCol/InterfaceColMenu.js`：集合弹窗已部分改造，需彻底移除 LegacyForm 引用，改为 v6 表单（新增/修改集合、导入接口）。
- 清理并删除 `client/components/LegacyForm/index.js`，确保全仓库无 `LegacyForm`、`Form.create`、`getFieldDecorator` 等引用（`rg` 验证）。
- 冒烟：集合新增、导入接口、删除/克隆集合与用例。

## 完成标准
- `rg "LegacyForm|getFieldDecorator|Form\\.create|wrappedComponentRef" client` 结果为 0。
- 所有迁移文件在功能冒烟后无阻断报错；新增/编辑/保存操作均可正常发请求并更新 UI。
- `pnpm build-client` 通过，无新增 lint/构建错误。
