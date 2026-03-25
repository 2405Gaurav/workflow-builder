import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { put } from '@vercel/blob';

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

    // Convert file → buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ Upload to Vercel Blob
    const blob = await put(
      `images/${Date.now()}-${file.name}`,
      buffer,
      {
        access: 'public',
        contentType: file.type || 'image/jpeg',
      }
    );

    // ✅ Store ONLY URL in DB
    const upload = await prisma.mediaUpload.create({
      data: {
        userId,
        fileName: file.name || 'untitled.jpg',
        mimeType: file.type || 'image/jpeg',
        sizeBytes: buffer.length,
        dataUrl: blob.url, // now actual URL
      },
    });

    return NextResponse.json({
      url: blob.url,
      id: upload.id,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}