import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;

    // Persist upload metadata + data URL to Neon DB
    const upload = await prisma.mediaUpload.create({
      data: {
        userId,
        fileName: file.name || 'untitled.jpg',
        mimeType: file.type || 'image/jpeg',
        sizeBytes: buffer.byteLength,
        dataUrl,
      },
    });

    return NextResponse.json({ url: upload.dataUrl, id: upload.id });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
