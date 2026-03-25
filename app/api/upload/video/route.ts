// app/api/upload/video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate file type before generating upload token
        if (!pathname.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
          throw new Error('Only video files are allowed');
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/x-matroska'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          tokenPayload: JSON.stringify({ userId , sizeBytes: Number(clientPayload)}),
        };
      },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
  const parsed = JSON.parse(tokenPayload!);
  const userId = parsed.userId as string;
  const sizeBytes = typeof parsed.sizeBytes === 'number' && !isNaN(parsed.sizeBytes) 
    ? parsed.sizeBytes 
    : 0;

  await prisma.mediaUpload.create({
    data: {
      userId,
      fileName: blob.pathname.split('/').pop() || 'untitled.mp4',
      mimeType: blob.contentType || 'video/mp4',
      sizeBytes: sizeBytes,
      dataUrl: blob.url,
    },
  });
},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}