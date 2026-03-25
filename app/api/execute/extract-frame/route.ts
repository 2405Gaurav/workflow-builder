// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { videoUrl, timestamp } = await req.json();

//     if (!videoUrl) {
//       return NextResponse.json(
//         { error: 'Video URL is required' },
//         { status: 400 }
//       );
//     }

//     // Try Trigger.dev first  
//     if (process.env.TRIGGER_SECRET_KEY && process.env.TRIGGER_API_URL) {
//       try {
//         // const triggerResponse = await fetch(`${process.env.TRIGGER_API_URL}/api/trigger`,
//           const triggerResponse = await fetch(`${process.env.TRIGGER_API_URL}/api/v1/runs`,  {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${process.env.TRIGGER_SECRET_KEY}`,
//           },
//         body: JSON.stringify({
//   task: 'extract-frame',
//   payload: {
//     videoUrl,
//     timestamp: timestamp || 0,
//   },
// }),
//         });

//         if (triggerResponse.ok) {
//           const result = await triggerResponse.json();
//           if (result?.output?.frameUrl) {
//             return NextResponse.json({ frameUrl: result.output.frameUrl });
//           }
//         }
//       } catch (triggerError) {
//         console.warn('Trigger.dev extract-frame failed, using fallback:', triggerError);
//       }
//     }

//     // Fallback: try ffmpeg via fluent-ffmpeg if available
//     try {
//       const ffmpeg = await import('fluent-ffmpeg').catch(() => null);
//       const fs = await import('fs');
//       const path = await import('path');
//       const os = await import('os');

//       if (ffmpeg) {
//         const tempDir = os.tmpdir();
//         const tempVideoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
//         const tempFramePath = path.join(tempDir, `frame-${Date.now()}.jpg`);

//         let videoBuffer: Buffer;

//         if (videoUrl.startsWith('data:')) {
//           const matches = videoUrl.match(/^data:[^;]+;base64,(.+)$/);
//           if (matches) {
//             videoBuffer = Buffer.from(matches[1], 'base64');
//           } else {
//             throw new Error('Invalid data URL');
//           }
//         } else {
//           const videoResponse = await fetch(videoUrl);
//           const arrayBuffer = await videoResponse.arrayBuffer();
//           videoBuffer = Buffer.from(arrayBuffer);
//         }

//         // fs.writeFileSync(tempVideoPath, videoBuffer);
//         fs.writeFileSync(tempVideoPath, new Uint8Array(videoBuffer));

//         const frameUrl = await new Promise<string>((resolve, reject) => {
//           ffmpeg.default(tempVideoPath)
//             .screenshots({
//               timestamps: [timestamp || 0],
//               filename: path.basename(tempFramePath),
//               folder: path.dirname(tempFramePath),
//             })
//             .on('end', () => {
//               try {
//                 const frameBuffer = fs.readFileSync(tempFramePath);
//                 const base64 = frameBuffer.toString('base64');
//                 const url = `data:image/jpeg;base64,${base64}`;

//                 // Clean up temp files
//                 try { fs.unlinkSync(tempVideoPath); } catch {}
//                 try { fs.unlinkSync(tempFramePath); } catch {}

//                 resolve(url);
//               } catch (readError) {
//                 reject(readError);
//               }
//             })
//             .on('error', (err: Error) => {
//               // Clean up temp files
//               try { fs.unlinkSync(tempVideoPath); } catch {}
//               reject(err);
//             });
//         });

//         return NextResponse.json({ frameUrl });
//       }
//     } catch (fallbackError) {
//       console.warn('FFmpeg fallback failed:', fallbackError);
//     }

//     // Last resort: return a placeholder response indicating frame extraction isn't available
//     return NextResponse.json({
//       error: 'Frame extraction requires Trigger.dev or FFmpeg to be configured',
//     }, { status: 500 });
//   } catch (error) {
//     console.error('Extract frame error:', error);
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Frame extraction failed' },
//       { status: 500 }
//     );
//   }
// }



// // import { NextRequest, NextResponse } from 'next/server';
// // import { auth } from '@clerk/nextjs/server';
// // import { tasks, runs } from '@trigger.dev/sdk/v3';
// // import type { extractFrameTask } from '@/trigger/tasks';

// // export async function POST(req: NextRequest) {
// //   try {
// //     const { userId } = await auth();
// //     if (!userId) {
// //       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// //     }

// //     const { videoUrl, timestamp } = await req.json();
// //     console.log('Received extract-frame request with:', { videoUrl, timestamp });

// //     if (!videoUrl) {
// //       return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
// //     }

// //     // Step 1: trigger the task
// //     const run = await tasks.trigger<typeof extractFrameTask>(
// //       'extract-frame',
// //       { videoUrl, timestamp: timestamp || 0 }
// //       // {console.log(videoUrl )}
// //     );

// //     // Step 2: poll until complete (timeout after 60s)
// //     const result = await runs.poll(run.id, { pollIntervalMs: 1000 });

// //     if (result.status === 'COMPLETED') {
// //       const output = result.output as { frameUrl: string };
// //       return NextResponse.json({ frameUrl: output.frameUrl });
// //     }

// //     return NextResponse.json(
// //       { error: `Task failed with status: ${result.status}` },
// //       { status: 500 }
// //     );

// //   } catch (error) {
// //     console.error('Extract frame error:', error);
// //     return NextResponse.json(
// //       { error: error instanceof Error ? error.message : 'Frame extraction failed' },
// //       { status: 500 }
// //     );
// //   }
// // }


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { tasks, runs } from "@trigger.dev/sdk/v3";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoUrl, timestamp } = await req.json();

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    // ==============================
    // ✅ 1. Trigger.dev (PRIMARY)
    // ==============================
    if (process.env.TRIGGER_SECRET_KEY) {
      try {
        const run = await tasks.trigger("extract-frame", {
          videoUrl,
          timestamp: timestamp ?? 0,
        });

        let output: any = null;

        for (let i = 0; i < 15; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const status = await runs.retrieve(run.id);

          if (status.status === "COMPLETED") {
            output = status.output;
            break;
          }

          if (status.status === "FAILED") {
            throw new Error("Trigger.dev task failed");
          }
        }

        if (output?.frameUrl) {
          return NextResponse.json({ frameUrl: output.frameUrl });
        }
      } catch (err) {
        console.warn("Trigger.dev failed → fallback:", err);
      }
    }

    // ==============================
    // ✅ 2. LOCAL FFmpeg FALLBACK
    // ==============================
    try {
      const ffmpeg = (await import("fluent-ffmpeg")).default;
      const fs = await import("fs/promises");
      const path = await import("path");
      const os = await import("os");

      ffmpeg.setFfmpegPath("ffmpeg");

      const videoPath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);
      const framePath = path.join(os.tmpdir(), `frame-${Date.now()}.jpg`);

      let videoBuffer: Buffer;

      // Handle base64 vs URL
      if (videoUrl.startsWith("data:")) {
        const match = videoUrl.match(/^data:video\/\w+;base64,(.+)$/);
        if (!match) throw new Error("Invalid base64 video");
        videoBuffer = Buffer.from(match[1], "base64");
      } else {
        const res = await fetch(videoUrl);
        if (!res.ok) throw new Error("Failed to fetch video");
        videoBuffer = Buffer.from(await res.arrayBuffer());
      }

      await fs.writeFile(videoPath, new Uint8Array(videoBuffer));

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .screenshots({
            timestamps: [timestamp ?? 0],
            filename: path.basename(framePath),
            folder: path.dirname(framePath),
          })
          .on("end", resolve)
          .on("error", reject);
      });

      const frameBuffer = await fs.readFile(framePath);

      // ✅ Upload frame to Vercel Blob
      const blob = await put(
        `frames/frame-${Date.now()}.jpg`,
        frameBuffer,
        {
          access: "public",
          contentType: "image/jpeg",
        }
      );

      // cleanup
      await Promise.all([
        fs.unlink(videoPath).catch(() => {}),
        fs.unlink(framePath).catch(() => {}),
      ]);

      return NextResponse.json({
        frameUrl: blob.url,
      });

    } catch (fallbackError: any) {
      console.error("FFmpeg fallback failed:", fallbackError.message);
    }

    return NextResponse.json(
      {
        error: "Frame extraction failed",
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("Extract frame main error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}