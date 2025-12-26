# React Router v6 迁移遗留清单 & 分工

目标：逐步移除 v5 风格跳转/路由写法（`history.push/replace`、`withRouter`、`Switch`、`Route component/render`、`Prompt` 等），统一到 v6 写法（`useNavigate`/`Navigate`、`useParams`/`useLocation`、`Routes`/`Route element`）。  
✅ 第二阶段已完成（2025-12-12）：`vite.config.js` 中的 `react-router-dom` shim alias 已移除，`client/shims/react-router-dom.js` 删除；客户端代码已完全使用原生 v6 API。本清单保留作历史记录/回溯参考。

建议人数：**3 人（A / B / C）**。按目录划分，互不改同一批文件。

---

## A：路由基础设施 / 顶层路由
范围：只改 `client/Application.js`、`client/components/AuthenticatedComponent.js`、`client/containers/User/User.js`（以及必要的路由相关 helper）。  
目标：顶层路由与鉴权逻辑 v6 化，为后续移除 shim 做准备。
状态：✅ 已完成（2025-12-12）。已移除 `BrowserRouter getUserConfirmation`，暂不处理 blocker。

1. `client/Application.js`
   - 把 `<Switch>` 改为 `<Routes>`。
   - 把 `<Route component=... exact ...>` 改为 v6 的 `element={<Comp />}`；`exact` 移除，按 v6 匹配规则整理。
   - `BrowserRouter getUserConfirmation` 在 v6 无此 API：  
     - 选项 1：先移除确认逻辑（最小变更）。  
     - 选项 2：用 v6 blocker（`unstable_useBlocker`/自定义离开确认）重做。
   - `requireAuthentication` 的使用方式改为 v6 友好（比如 `element={requireAuthentication(Comp)}` 或改成 `<RequireAuth><Comp /></RequireAuth>`）。

2. `client/components/AuthenticatedComponent.js`
   - 目前已改 `Navigate`，但仍依赖 `withRouter` 注入 props。  
   - 随 `Application.js` 一起：  
     - 要么保留 HOC 形式但只消费 v6 注入的 `router/location/params`；  
     - 要么重写为函数组件 `<RequireAuth />`，内部用 `useLocation()` + `<Navigate />`。

3. `client/containers/User/User.js`
   - 把内部 `<Switch>` 改为 `<Routes>`。
   - 两个子路由改为 v6：`<Route path="list" element={<List />} />`、`<Route path="profile/:uid" element={<Profile />} />`。
   - 如需做成布局路由，可引入 `<Outlet />`。

---

## B：全局/公共页面与组件跳转
范围：只改 `client/components/**`（除 Interface 相关）和 `client/containers/Home`、`client/containers/Group`、`client/containers/AddProject`、`client/containers/Login/LoginContainer.js`。  
目标：消除全局 UI 中的 `history.push/replace`、无必要的 `withRouter`。

1. `client/components/Header/Header.js`
   - `logout()`、`checkLoginState()` 中的 `this.props.history.push('/')` 改为 `this.props.router.navigate('/', { replace?: true })` 或改函数组件用 `useNavigate()`。
   - 评估是否可移除 `@withRouter`（若仅为跳转/取 location）。

2. `client/components/Header/Search/Search.js`
   - `onSelect` 内三处 `this.props.history.push(...)` 改为 `router.navigate(...)`。
   - 同步替换 `history` propTypes。

3. `client/components/ProjectCard/ProjectCard.js`
   - `goDetail` 的 `this.props.history.push(...)` 改为 `router.navigate(...)` 或 `useNavigate()`。

4. `client/components/ErrMsg/ErrMsg.js`
   - `onClick={() => this.props.history.push('/group')}` 改为 `router.navigate('/group')`。

5. `client/components/Breadcrumb/Breadcrumb.js`
   - 当前不使用 `history`，`@withRouter` 仅为触发 rerender；可改为函数组件 `useLocation()` 或直接移除 `withRouter`（确认 UI 是否仍能随路由变化更新）。

6. `client/containers/Group/GroupList/GroupList.js`
   - `componentDidMount`、`selectGroup`、以及设置默认 group 的 `history.push/replace` 改为 `router.navigate(path, { replace: true|false })`。

7. `client/containers/Home/Home.js`
   - `componentDidMount` 中登录后跳 `'/group/261'` 改为 `router.navigate('/group/261', { replace: true })` 或在路由层做重定向。
   - 文件内有 **重复的 `componentDidMount`**（后者空实现覆盖前者），迁移时顺手修复。

8. `client/containers/AddProject/AddProject.js`
   - 创建项目成功后 `this.props.history.push(...)` 改为 `router.navigate(...)`。

9. `client/containers/Login/LoginContainer.js`
   - 现在使用 `router.navigate`，但仍保留 `withRouter`；可视情况改函数组件以彻底移除 `history`/`withRouter`。

---

## C：接口/测试集合模块跳转与参数获取
范围：只改 `client/containers/Project/Interface/**`。  
目标：该模块内全面去 `history.*`，逐步去 `withRouter/match`，补上 v6 等价能力。

1. `client/containers/Project/Interface/Interface.js`
   - `goTab()` 里 `history.push`/`window.location.assign` 改为 `router.navigate(next)`。
   - 末尾 fallback `this.props.history.replace(...)` 改为 `router.navigate(..., { replace: true })`。
   - 如条件允许可改函数组件：用 `useParams()`/`useLocation()`/`useNavigate()` 替代手工解析 pathname。

2. `client/containers/Project/Interface/InterfaceList/InterfaceMenu.js`
   - `onSelect`、新增/删除分类、选择接口等所有 `history.push` 改为 `router.navigate`。
   - 注意保留原 push/replace 语义（必要时传 `{ replace: true }`）。

3. `client/containers/Project/Interface/InterfaceList/InterfaceList.js`
   - `handleAddInterface` 成功后的 `this.props.history.push(...)` 改为 v6 navigate。  
   - 该组件不直接用 `withRouter`，需要：  
     - 从父级透传 `router.navigate`；或  
     - 改成函数组件用 `useNavigate()`。

4. `client/containers/Project/Interface/InterfaceList/InterfaceContent.js`
   - `Prompt` 目前是 shim 的 no-op，离开编辑页无拦截。  
   - 需要用 v6 blocker 重做离开确认（可结合 A 的路由 blocker 方案）。  
   - 同时把 `withRouter/match` 相关用法迁到 `useParams()` 或 `props.router.params`。

5. `client/containers/Project/Interface/InterfaceList/Edit.js`
   - 仅用 `match.params.actionId`：改用 `useParams()` 或从父级传入 `actionId`，可去 `withRouter`。

6. `client/containers/Project/Interface/InterfaceList/Run/Run.js`
   - 仅用 `match.params.id`：改 `useParams()` 或父级传 `projectId`，去 `withRouter`。

7. `client/containers/Project/Interface/InterfaceList/Run/AddColModal.js`
   - 同上，去 `withRouter/match`。

8. `client/containers/Project/Interface/InterfaceCol/InterfaceColMenu.js`
   - 所有 `this.props.history.push(...)` 改为 `router.navigate(...)`。

9. `client/containers/Project/Interface/InterfaceCol/InterfaceColContent.js`
   - 目前主要依赖 `match.params.id`、以及 `withRouter` 注入；逐步改为 `useParams()`/父级传参，去 `withRouter`。

10. `client/containers/Project/Interface/InterfaceCol/InterfaceCaseContent.js`
   - 同上，去 `withRouter/match`。

---

### 备注
- 全部完成后，再讨论是否移除 `vite.config.js` 中对 `react-router-dom` 的 shim alias；那一步会是一次性全局改动，需单独排期。  
- 现有测试套件本身有未通过用例（重复 test title 等），与本次迁移无关；迁移完成后可再统一处理。
