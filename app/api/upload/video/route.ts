import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/db';

// ✅ App Router equivalents (replaces Pages Router config export)
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Only video files are allowed' }, { status: 400 });
    }

    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 413 }
      );
    }

    const blob = await put(
      `uploads/${userId}/${Date.now()}-${file.name}`,
      file.stream(),
      {
        access: 'public',
        contentType: file.type || 'video/mp4',
      }
    );

    const upload = await prisma.mediaUpload.create({
      data: {
        userId,
        fileName: file.name || 'untitled.mp4',
        mimeType: file.type || 'video/mp4',
        sizeBytes: file.size,
        dataUrl: blob.url,
      },
    });

    return NextResponse.json({ url: blob.url, id: upload.id });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}