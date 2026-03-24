import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

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
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({ executions: data });
  } catch (error) {
    console.error('Get executions error:', error);
    return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
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
