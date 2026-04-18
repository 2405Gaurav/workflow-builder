import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// app/api/executions/[id]/route.ts
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Map incoming body to Prisma fields
  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.node_results) updateData.nodeResults = body.node_results; // Map snake to camel
  if (body.duration_ms) updateData.durationMs = body.duration_ms;   // Map snake to camel
  if (body.error_message) updateData.errorMessage = body.error_message;
  if (body.completed_at) updateData.completedAt = new Date(body.completed_at);

  const result = await prisma.workflowExecution.updateMany({
    where: { id, userId },
    data: updateData
  });

  return NextResponse.json({ success: result.count > 0 });
}

// app/api/executions/[id]/route.ts

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    // 1. FIX: Return early if userId is null. 
    // This tells TypeScript that from this point forward, userId is a STRING.
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 2. FIX: Use findFirst. 
    // findUnique usually only allows 'where: { id }'. 
    // To filter by ID AND UserID together, findFirst is the correct method.
    const execution = await prisma.workflowExecution.findFirst({
      where: { 
        id, 
        userId // Now TypeScript knows this is a string, not null
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ execution });
  } catch (error) {
    console.error('Get execution error:', error);
    return NextResponse.json({ error: 'Failed to fetch execution' }, { status: 500 });
  }
}

// ... keep your existing PATCH function below ...