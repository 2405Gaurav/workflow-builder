# NextFlow - Complete Setup Guide

## Overview

NextFlow is a production-grade visual workflow builder for creating and executing complex LLM pipelines. This guide walks you through the complete setup process.

## What's Been Built

### ✅ Complete Implementation

1. **Database Schema** (Supabase/PostgreSQL)
   - `workflows` table with JSONB storage for nodes/edges
   - `workflow_executions` table for history tracking
   - Row Level Security (RLS) policies configured
   - Indexes on user_id, workflow_id, and status

2. **6 Node Types** (All Implemented)
   - ✅ Text Node - Text input/output
   - ✅ Upload Image Node - Image upload with preview
   - ✅ Upload Video Node - Video upload with preview
   - ✅ LLM Node - Gemini AI integration with result display
   - ✅ Crop Image Node - FFmpeg image cropping
   - ✅ Extract Frame Node - FFmpeg frame extraction

3. **Workflow Engine**
   - ✅ DAG validation (cycle detection)
   - ✅ Topological sorting for execution order
   - ✅ Parallel execution of independent branches
   - ✅ Type-safe connection validation
   - ✅ Real-time status updates

4. **UI Components**
   - ✅ React Flow canvas with dot grid background
   - ✅ Node sidebar with drag-and-drop
   - ✅ History sidebar with execution details
   - ✅ Toolbar with Run/Save/Undo/Redo
   - ✅ Minimap and controls
   - ✅ Animated edges

5. **API Routes**
   - ✅ `/api/workflows` - CRUD operations
   - ✅ `/api/executions` - Execution history
   - ✅ `/api/execute/llm` - LLM execution
   - ✅ `/api/execute/crop-image` - Image cropping
   - ✅ `/api/execute/extract-frame` - Frame extraction
   - ✅ `/api/upload/image` - Image upload
   - ✅ `/api/upload/video` - Video upload

6. **Authentication**
   - ✅ Clerk integration
   - ✅ Protected routes via middleware
   - ✅ Sign-in/Sign-up pages
   - ✅ User-scoped data

7. **State Management**
   - ✅ Zustand store
   - ✅ History management (undo/redo)
   - ✅ Execution tracking
   - ✅ Node selection

8. **Sample Workflow**
   - ✅ Product Marketing Generator example
   - ✅ Load Sample button in toolbar

## Quick Start

### 1. Environment Setup

Copy the environment file:

```bash
cp .env.example .env.local
```

### 2. Required API Keys

#### Clerk (Authentication)
1. Go to https://clerk.com
2. Create application
3. Add to `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### Supabase (Already Configured)
The database is already set up with:
- Tables created
- RLS policies enabled
- Indexes configured

Just add your credentials to `.env.local`.

#### Google AI (Required for LLM Node)
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env.local`:
```
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## File Structure

```
nextflow/
├── app/
│   ├── api/
│   │   ├── execute/
│   │   │   ├── llm/route.ts           # LLM execution
│   │   │   ├── crop-image/route.ts    # Image cropping
│   │   │   └── extract-frame/route.ts # Frame extraction
│   │   ├── upload/
│   │   │   ├── image/route.ts         # Image upload
│   │   │   └── video/route.ts         # Video upload
│   │   ├── workflows/
│   │   │   ├── route.ts               # List/Create workflows
│   │   │   └── [id]/route.ts          # Get/Update/Delete workflow
│   │   └── executions/
│   │       ├── route.ts               # List/Create executions
│   │       └── [id]/route.ts          # Update execution
│   ├── workflow/page.tsx              # Main workflow builder
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── layout.tsx                     # Root layout with Clerk
│   └── page.tsx                       # Redirect to /workflow
│
├── components/
│   ├── nodes/
│   │   ├── TextNode.tsx               # Text input node
│   │   ├── UploadImageNode.tsx        # Image upload node
│   │   ├── UploadVideoNode.tsx        # Video upload node
│   │   ├── LLMNode.tsx                # LLM processing node
│   │   ├── CropImageNode.tsx          # Image cropping node
│   │   └── ExtractFrameNode.tsx       # Frame extraction node
│   ├── WorkflowCanvas.tsx             # React Flow canvas
│   ├── NodeSidebar.tsx                # Left sidebar (node palette)
│   ├── HistorySidebar.tsx             # Right sidebar (execution history)
│   ├── WorkflowToolbar.tsx            # Top toolbar (run/save/undo)
│   └── LoadSampleButton.tsx           # Load sample workflow
│
├── lib/
│   ├── types.ts                       # TypeScript definitions
│   ├── store.ts                       # Zustand state management
│   ├── validation.ts                  # DAG validation & topological sort
│   ├── execution-engine.ts            # Workflow execution logic
│   ├── supabase.ts                    # Supabase client
│   └── sample-workflow.ts             # Sample workflow definition
│
├── trigger/
│   └── tasks.ts                       # Trigger.dev tasks (optional)
│
├── middleware.ts                      # Clerk middleware
├── .env.local                         # Environment variables
└── README.md                          # Documentation
```

## Architecture

### Flow Diagram

```
User → Canvas → Zustand Store → Execution Engine → API Routes → Database
                                      ↓
                                 Node Execution
                                      ↓
                            Google AI / FFmpeg
```

### Data Flow

1. **Node Creation**
   - User clicks node in sidebar
   - Node added to Zustand store
   - React Flow renders node component

2. **Connection**
   - User drags from output to input handle
   - Validation checks output type matches input type
   - Edge added to store if valid

3. **Execution**
   - User clicks "Run All/Selected/Single"
   - Execution engine validates DAG
   - Topological sort determines execution order
   - Nodes execute sequentially/parallel based on dependencies
   - Results stored in database
   - UI updates in real-time

4. **History**
   - Each execution creates record in `workflow_executions`
   - Node-level results stored in JSONB
   - History sidebar displays all executions
   - Click execution to see detailed results

## Key Features Explained

### Type-Safe Connections

```typescript
// Only matching types can connect:
Text → Text ✅
Image → Image ✅
Video → Video ✅

Text → Image ❌ (prevented)
Image → Video ❌ (prevented)
```

### DAG Validation

Before execution:
1. Check for cycles
2. Build dependency graph
3. Topological sort
4. Parallel execution where possible

### Node Status

Each node shows real-time status:
- `idle` - Gray border
- `running` - Blue border, animated pulse
- `success` - Green border
- `error` - Red border with error message

### Execution Scopes

1. **Full Workflow** - All nodes
2. **Partial Run** - Selected nodes only
3. **Single Node** - One node

## Sample Workflow Walkthrough

The included "Product Marketing Generator" demonstrates:

### Branch A (Product Analysis)
```
Upload Image → Crop Image → LLM (Analysis)
                ↑              ↑
                └──────────────┘
               (cropped + text)
```

### Branch B (Context)
```
Upload Video → Extract Frame
```

### Final (Marketing)
```
Branch A Output + Frame → LLM (Marketing Copy)
```

**Execution Flow:**
1. Branches A & B run in parallel
2. LLM waits for both branches
3. Final marketing post generated

## Customization

### Adding New Node Types

1. Define type in `lib/types.ts`
2. Create component in `components/nodes/`
3. Register in `WorkflowCanvas.tsx`
4. Add execution logic in `execution-engine.ts`
5. Create API route if needed

### Extending Execution

Modify `lib/execution-engine.ts`:
- Add new node execution logic
- Implement custom validation
- Add pre/post execution hooks

## Production Deployment

### Netlify (Recommended)

Already configured in `netlify.toml`:

```bash
git push origin main
```

1. Connect repo to Netlify
2. Add environment variables
3. Deploy automatically

### Vercel

```bash
vercel
```

Add environment variables in Vercel dashboard.

## Troubleshooting

### Build Errors

If you see Turbopack errors:
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Clerk Issues

1. Verify keys start with `pk_` and `sk_`
2. Check middleware is not blocking routes
3. Ensure redirect URLs match

### Database Issues

1. Check Supabase connection
2. Verify RLS policies
3. Check user authentication

### Execution Failures

1. Review execution history
2. Check node configurations
3. Verify API keys (Google AI)
4. Check browser console

## Testing

### Manual Testing Checklist

- [ ] Add each node type
- [ ] Connect nodes with valid types
- [ ] Try invalid connections (should fail)
- [ ] Run full workflow
- [ ] Run selected nodes
- [ ] Run single node
- [ ] Check history updates
- [ ] Save workflow
- [ ] Load workflow
- [ ] Undo/Redo operations
- [ ] Sign out/in

## Performance

### Optimization

- React Flow handles 1000+ nodes efficiently
- Parallel execution reduces total time
- JSONB storage for flexible schemas
- Indexed queries for fast lookups

### Scalability

- Zustand prevents unnecessary re-renders
- Memoized components
- Lazy loading of execution results
- Database indexes on hot paths

## Security

### Implemented

- ✅ Row Level Security (RLS)
- ✅ User-scoped data access
- ✅ Authentication on all routes
- ✅ Type-safe API endpoints
- ✅ Input validation
- ✅ Secure file uploads

### Best Practices

- Never expose API keys in client code
- Validate all inputs server-side
- Use HTTPS in production
- Regular security audits
- Keep dependencies updated

## Next Steps

### Enhancements

1. **Trigger.dev Integration**
   - Implement async task execution
   - Add webhook support
   - Enable long-running tasks

2. **Transloadit Integration**
   - Production file uploads
   - Image optimization
   - Video transcoding

3. **Advanced Features**
   - Workflow templates
   - Team collaboration
   - Version control
   - Workflow marketplace

4. **UI Improvements**
   - Node search
   - Bulk operations
   - Keyboard shortcuts
   - Dark mode

## Support & Resources

- **Documentation**: README.md
- **Sample Workflows**: Load Sample button
- **Type Definitions**: lib/types.ts
- **API Reference**: app/api/

## License

MIT License - See LICENSE file for details

---

Built with ❤️ using Next.js, React Flow, Supabase, and Google Generative AI
