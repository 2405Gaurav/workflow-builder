import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// app/api/executions/route.ts

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workflowId = req.nextUrl.searchParams.get('workflowId');

    const data = await prisma.workflowExecution.findMany({
      where: {
        userId,
        ...(workflowId ? { workflowId } : {}),
      },
      // Select all fields needed for the history sidebar, including nodeResults
      select: {
        id: true,
        workflowId: true,
        status: true,
        scope: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
        errorMessage: true,
        nodeResults: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 20, 
    });

    return NextResponse.json({ executions: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest){
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { workflow_id, scope, node_results } = await req.json();

    const data = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow_id,
        userId,
        status: 'running',
        scope: scope || 'full',
        nodeResults: node_results || {},
      },
    });

    return NextResponse.json({ execution: data });
    // {console.log(execution)}
  } catch (error) {
    console.error('Create execution error:', error);
    return NextResponse.json({ error: 'Failed to create execution' }, { status: 500 });
  }
}
