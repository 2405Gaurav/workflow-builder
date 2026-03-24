import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const data = await prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ workflow: data });
  } catch (error) {
    console.error('Get workflow error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { name, description, nodes, edges } = await req.json();

    const data = await prisma.workflow.updateMany({
      where: { id, userId },
      data: {
        name,
        description,
        nodes,
        edges,
        updatedAt: new Date(),
      },
    });

    if (data.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch the updated record to return it
    const updated = await prisma.workflow.findFirst({
      where: { id, userId },
    });

    return NextResponse.json({ workflow: updated });
  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    await prisma.workflow.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete workflow error:', error);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
