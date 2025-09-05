# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview capabilities. It uses Claude AI to generate React components based on natural language descriptions and provides real-time preview using a virtual file system.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (Next.js with Turbopack)
- `npm run dev:daemon` - Start dev server in background, logs to logs.txt
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests
- `npm run setup` - Full setup (install deps, generate Prisma client, run migrations)

### Database Commands
- `npm run db:reset` - Reset database (force reset migrations)
- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Run database migrations

### Testing
- Individual test files can be run with `npm run test path/to/test.file`
- Tests use Vitest with jsdom environment for React component testing

## Architecture Overview

### Core Technologies
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling
- **Prisma** with SQLite for data persistence
- **Vercel AI SDK** for LLM integration
- **Anthropic Claude** for component generation

### Key Architecture Components

#### Virtual File System (`src/lib/file-system.ts`)
- Complete in-memory file system implementation
- Supports file/directory operations, path normalization, serialization
- Used for component generation without writing to disk
- Integrates with AI tools for file manipulation

#### Context Architecture
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`) - Manages virtual file system state
- **ChatContext** (`src/lib/contexts/chat-context.tsx`) - Handles AI chat interactions and tool calls

#### Live Preview System (`src/components/preview/PreviewFrame.tsx`)
- Real-time React component preview using iframe sandboxing
- Transforms JSX/TSX files using Babel for browser execution
- Supports import maps for module resolution
- Entry point detection (App.jsx, index.jsx, etc.)

#### AI Integration (`src/app/api/chat/route.ts`)
- Uses Vercel AI SDK with streaming responses
- Tool system for file operations (str_replace_editor, file_manager)
- Project persistence for authenticated users
- Mock provider fallback when no API key provided

#### Database Schema
- **Users** - Authentication and project ownership
- **Projects** - Stores chat messages and virtual file system data as JSON
- Custom Prisma client output to `src/generated/prisma/`

### Project Structure Patterns
- **Actions** (`src/actions/`) - Server actions for project CRUD operations
- **Components** organized by feature (auth, chat, editor, preview, ui)
- **Tools** (`src/lib/tools/`) - AI tool implementations for file operations
- **Transform** (`src/lib/transform/`) - JSX compilation and import map generation

## Development Notes

### Authentication
- Optional authentication system (can work anonymously)
- JWT-based sessions with bcrypt password hashing
- Anonymous work tracking in localStorage

### Environment Variables
- `ANTHROPIC_API_KEY` - Optional, app works without it using mock responses
- Project runs in development mode without additional configuration

### File Generation Workflow
1. User describes component via chat interface
2. AI generates files using virtual file system tools
3. Files are transformed and compiled for browser preview
4. Changes persist to database for authenticated users

### Testing Strategy
- Component tests using React Testing Library
- File system and transformation logic unit tests
- Vitest configuration with TypeScript path resolution
- Use comments sparingly. Only comment complex code.
- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.
- vitest vonconfig is in vitest.config.mts