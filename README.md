# NextFlow - LLM Workflow Builder

A production-grade visual workflow builder for creating and executing complex LLM pipelines, inspired by Krea.ai.

## Features

- **Visual Workflow Builder**: Drag-and-drop interface with React Flow
- **6 Node Types**: Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame
- **Type-Safe Connections**: Smart edge validation preventing invalid connections
- **DAG Execution Engine**: Topological sorting with parallel execution support
- **Execution History**: Track all workflow runs with detailed node-level results
- **Real-time Status**: Live node status updates during execution
- **Undo/Redo**: Full history management
- **Authentication**: Complete Clerk integration
- **Database**: PostgreSQL with Neon DB (serverless)

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- React Flow
- Zustand (state management)
- Zod (validation)
- Lucide React (icons)

### Backend
- Next.js API Routes
- PostgreSQL (Neon DB)
- Clerk (authentication)

### Integrations
- Trigger.dev (task execution)
- Transloadit (file uploads)
- Google Generative AI (Gemini)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

#### Clerk Auth
1. Go to https://clerk.com
2. Create a new application
3. Copy the publishable key and secret key
4. Add to `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### Neon DB
1. Go to https://neon.tech and create a project
2. Copy the connection string
3. Run the schema from `lib/schema.sql` in the Neon SQL editor
4. Add to `.env`:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

#### Google Generative AI
1. Go to https://makersuite.google.com/app/apikey
2. Create an API key
3. Add to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=...
```

#### Trigger.dev (Optional for advanced features)
1. Go to https://trigger.dev
2. Create a project
3. Get your secret key
4. Add to `.env.local`:
```
TRIGGER_SECRET_KEY=...
NEXT_PUBLIC_TRIGGER_PUBLIC_TOKEN=...
```

#### Transloadit (Optional for production uploads)
1. Go to https://transloadit.com
2. Create an account
3. Get your credentials
4. Add to `.env.local`:
```
NEXT_PUBLIC_TRANSLOADIT_KEY=...
TRANSLOADIT_SECRET=...
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## Usage

### Creating a Workflow

1. **Add Nodes**: Click nodes in the left sidebar to add them to canvas
2. **Connect Nodes**: Drag from one node's output handle to another's input
3. **Configure**: Click nodes to edit their properties
4. **Execute**: Use toolbar buttons to run workflow

### Node Types

#### 1. Text Node
- Output: Text
- Use: Provide text input to other nodes

#### 2. Upload Image Node
- Output: Image URL
- Use: Upload images for processing

#### 3. Upload Video Node
- Output: Video URL
- Use: Upload videos for frame extraction

#### 4. LLM Node
- Input: Text, Images (optional, multiple)
- Output: Text
- Models: Gemini 1.5 Flash, Pro, 2.0 Flash
- Use: Generate text using AI

#### 5. Crop Image Node
- Input: Image URL
- Output: Cropped image URL
- Parameters: X%, Y%, Width%, Height%
- Use: Crop images to specific dimensions

#### 6. Extract Frame Node
- Input: Video URL
- Output: Image URL (extracted frame)
- Parameter: Timestamp (seconds)
- Use: Extract specific frames from videos

### Execution Modes

- **Run All**: Execute entire workflow
- **Run Selected**: Execute only selected nodes
- **Run Single**: Execute a single selected node

### Connection Rules

Type-safe connections are enforced:
- Text → Text only
- Image → Image only
- Video → Video only

Invalid connections are prevented visually.

## Sample Workflow: Product Marketing Generator

This example workflow demonstrates the power of NextFlow:

### Branch A (Product Analysis)
1. Upload Image → Product photo
2. Crop Image → Focus on product
3. Text Node → Product description
4. LLM Node → Analyze product features

### Branch B (Context)
1. Upload Video → Product demo video
2. Extract Frame → Key moment frame

### Final (Marketing Post)
1. LLM Node → Combines:
   - Product analysis from Branch A
   - Cropped image
   - Extracted frame
2. Output: Marketing copy with images

Both branches execute in parallel, then merge for final generation.

## Architecture

### State Management
- Zustand store manages nodes, edges, executions
- History tracking for undo/redo
- Real-time updates during execution

### Validation
- DAG validation prevents cycles
- Topological sorting for execution order
- Type checking on connections

### Execution Engine
- Analyzes dependencies
- Parallel execution of independent branches
- Sequential execution within dependencies
- Real-time status updates

### Database Schema

#### workflows table
- id, user_id, name, description
- nodes (JSONB), edges (JSONB)
- created_at, updated_at

#### workflow_executions table
- id, workflow_id, user_id
- status, scope, duration_ms
- node_results (JSONB)
- started_at, completed_at, error_message

### Security
- User-scoped data access (filtered at API layer)
- Clerk authentication on all routes
- Type-safe API endpoints

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── execute/      # Execution endpoints
│   │   ├── upload/       # Upload endpoints
│   │   ├── workflows/    # Workflow CRUD
│   │   └── executions/   # Execution history
│   ├── workflow/         # Main workflow page
│   ├── sign-in/          # Auth pages
│   └── sign-up/
├── components/
│   ├── nodes/            # Node components (6 types)
│   ├── WorkflowCanvas.tsx
│   ├── NodeSidebar.tsx
│   ├── HistorySidebar.tsx
│   └── WorkflowToolbar.tsx
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── store.ts          # Zustand store
│   ├── validation.ts     # DAG validation
│   ├── execution-engine.ts
│   ├── db.ts             # Neon DB client
│   └── schema.sql        # DB migration
└── trigger/
    └── tasks.ts          # Trigger.dev tasks
```

## Development

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Database Migrations

Run `lib/schema.sql` in the Neon SQL editor to create tables. Check the schema in:
- Neon dashboard → SQL Editor

## Production Deployment

### Netlify (Recommended)

1. Connect your repository
2. Add environment variables
3. Deploy

Configuration is already set in `netlify.toml`.

### Vercel

1. Import project
2. Add environment variables
3. Deploy

## Troubleshooting

### Clerk Issues
- Verify publishable key starts with `pk_`
- Ensure secret key matches environment
- Check middleware configuration

### Neon DB Connection
- Verify DATABASE_URL in `.env`
- Ensure schema has been applied
- Ensure user is authenticated

### Execution Failures
- Check node configurations
- Verify all required inputs are provided
- Review execution history for errors
- Check API logs

## License

MIT

## Support

For issues and questions:
1. Check execution history for detailed errors
2. Review node configurations
3. Verify environment variables
4. Check browser console for errors
