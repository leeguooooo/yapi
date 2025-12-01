# Repository Guidelines

Quick guide for contributing to YApi.

## Project Structure & Module Organization
- `client/`: React SPA via Vite (`index.jsx`); UI in `components/`, state in `containers/`/`reducer/`, assets in `images/`, `styles/`, `iconfont/`.
- `server/`: Koa backend (`server/app.js`) with controllers, middleware, models; reads MongoDB and options from `config.json`.
- `common/`: Shared utilities for client/server (markdown, schema diff, import/export helpers, mock extras).
- `exts/`: Bundled `yapi-plugin-*` packages; follow the same prefix when adding plugins.
- `static/`: Built client assets served by the backend; `docs/` and `ydoc*.js` handle docs; tests live in `test/` with fixtures.

## Build, Test, and Development Commands
- `pnpm install` (Node >= 18, pnpm >= 9) to install dependencies.
- `pnpm dev` runs backend (`dev-server`) and Vite client (`dev-client`) together; run each separately to isolate issues.
- `pnpm build-client` builds production assets into `static/prd`; `pnpm start` serves the built bundle via Koa.
- `pnpm install-server` bootstraps DB/config tables; base new configs on `config_example.json` and keep secrets out of git.
- `pnpm test` executes the Ava suite; add `--match \"pattern\"` for focused runs.

## Coding Style & Naming Conventions
- Prettier (`.prettierrc.js`): 2-space indent, 100-char width, semicolons, single quotes (including JSX), no trailing commas, arrow parens avoided when possible.
- ESLint extends `eslint:recommended` + `plugin:react/recommended`; keep JSX at 2 spaces and add disables only when justified.
- Use `PascalCase` for React components, `camelCase` for variables/functions, and kebab-case for multiword files/routes; keep plugin packages prefixed `yapi-plugin-`.
- Prefer functional components/hooks; use aliases in `webpack.alias.js` and shared helpers in `common/`.

## Testing Guidelines
- Ava tests sit in `test/` (e.g., `test/server`, `test/common`); mirror this layout for new coverage and name files `*.test.js`.
- Co-locate fixtures (see `openapi31-test.json`, `swagger.v2.json`); mock network/DB calls to keep runs fast.
- Cover new endpoints, schema transforms, and mock logic with success and edge cases; note any skipped tests.
- Run `pnpm test` before opening a PR and include the results in the description.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (Angular preset used by `pnpm changelog`), e.g., `feat: add swagger v3 import guard`, `fix: normalize mock rule paths`.
- PRs should include purpose, linked issue, test results, and screenshots/GIFs for UI-visible changes.
- Call out config or migration impacts (Mongo collections, plugin toggles) and update `docs/` or `config_example.json` when behavior shifts.

## API Compatibility Notes
- `/api/interface/list_menu` 默认返回扁平分类（兼容旧前端）；新前端需传 `tree=1` 获取树形分类含 `children` 和 `list`。
- 分类表新增 `parent_id`（默认 0），旧数据无需迁移即可作为根分类；删除分类会级联删除其子分类和接口。
