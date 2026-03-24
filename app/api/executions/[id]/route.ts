import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, node_results, completed_at, duration_ms, error_message } = await req.json();

    // Build the update data dynamically — only set fields that are provided
    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (node_results !== undefined) updateData.nodeResults = node_results;
    if (completed_at !== undefined) updateData.completedAt = new Date(completed_at);
    if (duration_ms !== undefined) updateData.durationMs = duration_ms;
    if (error_message !== undefined) updateData.errorMessage = error_message;

    const result = await prisma.workflowExecution.updateMany({
      where: { id, userId },
      data: updateData,
    });

    if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch the updated record to return it
    const updated = await prisma.workflowExecution.findFirst({
      where: { id, userId },
    });

    return NextResponse.json({ execution: updated });
  } catch (error) {
    console.error('Update execution error:', error);
    return NextResponse.json({ error: 'Failed to update execution' }, { status: 500 });
  }
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