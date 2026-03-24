import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ workflows: data });
  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, nodes, edges } = await req.json();

    const data = await prisma.workflow.create({
      data: {
        userId,
        name: name || 'Untitled Workflow',
        description: description || '',
        nodes: nodes || [],
        edges: edges || [],
      },
    });

    return NextResponse.json({ workflow: data });
  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
