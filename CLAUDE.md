# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YApi is a visual API management platform built with React + Koa.js that provides comprehensive API documentation, testing, and mocking capabilities. It's designed for development teams to manage their APIs efficiently with features like automated testing, mock servers, and data import/export from various formats.

## Architecture

### Backend (Node.js/Koa.js)
- **Main App**: `server/app.js` - Entry point with middleware setup
- **Database**: MongoDB with Mongoose ODM
- **Plugin System**: Extensible architecture with 12+ built-in plugins
- **Mock Server**: Advanced mocking with conditional responses
- **API Routes**: RESTful API in `server/controllers/`

### Frontend (React/Redux)
- **Build System**: ykit (webpack-based) with Ant Design
- **State Management**: Redux with promise middleware
- **UI Components**: Ant Design 3.2.2 with custom styling
- **Code Editor**: ACE editor for API documentation

### Plugin Architecture
- **Built-in Plugins**: Located in `exts/` directory
- **Hook System**: 17 server-side and 12 client-side hooks
- **Plugin Types**: Import/export, authentication, UI extensions, analytics
- **Configuration**: Plugins defined in `common/config.js` or `config.json`

## Development Commands

### Setup and Installation
```bash
npm install                    # Install dependencies
npm run install-server        # Initialize database (required for first run)
```

### Development
```bash
npm run dev                    # Run both client and server in development
npm run dev-server             # Backend only (nodemon with hot reload)
npm run dev-client             # Frontend only (ykit dev server on port 4000)
```

### Production
```bash
npm run build-client           # Build frontend assets
npm start                      # Run production server
```

### Testing
```bash
npm test                       # Run AVA test suite
```

### Database Management
```bash
npm run install-server         # Initialize MongoDB collections and admin user
```

## Configuration

### Database Setup
- Copy `config_example.json` to `config.json` 
- Configure MongoDB connection in `db` section
- Set admin account email and port

### Plugin Configuration
- Built-in plugins: Edit `common/config.js` `exts` array
- External plugins: Add to `config.json` `plugins` array
- Plugin options passed via `options` object

## Key File Locations

### Backend Structure
- `server/app.js` - Main application entry point
- `server/controllers/` - API route handlers
- `server/models/` - MongoDB/Mongoose models
- `server/middleware/mockServer.js` - Mock server implementation
- `server/utils/` - Utility functions and database connection

### Frontend Structure
- `client/containers/` - Main React container components
- `client/components/` - Reusable UI components
- `client/reducer/` - Redux state management
- `client/styles/` - SCSS stylesheets and themes

### Plugin Development
- `exts/yapi-plugin-*/` - Built-in plugin implementations
- `common/plugin.js` - Plugin initialization utilities
- Hook registration via `bindHook()` and `emitHook()`

## Testing

### Framework
- **AVA** test runner with Babel transpilation
- **Rewire** for testing internal functions
- Test files located in `test/` directory

### Test Categories
- `test/common/` - Utility function tests
- `test/server/` - Server-side logic tests
- `test/lib.test.js` - Library function tests
- `test/mock-extra.test.js` - Mock system tests

## Code Style and Linting

### ESLint Configuration
- React/JSX support with 2-space indentation
- No trailing commas (`comma-dangle: never`)
- Console statements allowed in development

### Prettier Configuration
- 100 character line width
- Single quotes for strings and JSX
- No trailing commas
- Semicolons required

### Build Configuration
- **ykit** build system with webpack
- Ant Design integration with tree-shaking
- Development: source maps enabled
- Production: UglifyJS minification with gzip compression

## Common Development Patterns

### Plugin Development
1. Create plugin directory in `exts/yapi-plugin-[name]/`
2. Implement `index.js` with server/client flags
3. Add server logic in `server.js`, client in `client.js`
4. Register hooks using `bindHook(hookName, callback)`
5. Add plugin to `common/config.js` exts array

### Mock Server Extension
- Implement conditional mock responses in `exts/yapi-plugin-advanced-mock/`
- Use hook system to intercept mock requests
- Support for JavaScript-based dynamic mock data

### API Controller Pattern
- Extend `server/controllers/base.js` for common functionality
- Use Mongoose models from `server/models/`
- Implement standard CRUD operations with proper error handling

## Database Schema

### Core Collections
- **users** - User accounts and authentication
- **groups** - Organization/team groupings
- **projects** - API project containers
- **interfaces** - API endpoint definitions
- **interface_cats** - Interface categories/folders
- **interface_cases** - Test cases for interfaces

### Plugin Collections
- Plugin-specific collections follow naming pattern: `[plugin_name]_*`
- Example: `adv_mock_*` for advanced mock plugin data

## Development Environment

### Requirements
- Node.js 7.6+ (for async/await support)
- MongoDB 2.6+
- npm 4.1.2+

### Local Development
- Frontend dev server: `http://localhost:4000`
- Backend API: `http://localhost:3000` (configurable)
- MongoDB: `mongodb://localhost:27017/yapi`

## Deployment Notes

### PM2 Process Management
```bash
pm2 start server/app.js --name yapi
pm2 stop yapi
pm2 restart yapi
```

### Production Considerations
- Use `NODE_ENV=production` for optimized builds
- Configure reverse proxy (nginx) for static asset serving
- Set up MongoDB replica set for high availability
- Enable gzip compression for static assets