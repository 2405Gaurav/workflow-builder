// import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { imageUrl, x, y, width, height } = await req.json();

//     if (!imageUrl) {
//       return NextResponse.json(
//         { error: 'Image URL is required' },
//         { status: 400 }
//       );
//     }

//     // Try Trigger.dev first
//     if (process.env.TRIGGER_SECRET_KEY && process.env.TRIGGER_API_URL) {
//       try {
//         const triggerResponse = await fetch(`${process.env.TRIGGER_API_URL}/api/trigger`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${process.env.TRIGGER_SECRET_KEY}`,
//           },
//           body: JSON.stringify({
//             id: 'crop-image',
//             payload: {
//               imageUrl,
//               x: x || 0,
//               y: y || 0,
//               width: width || 100,
//               height: height || 100,
//             },
//           }),
//         });

//         if (triggerResponse.ok) {
//           const result = await triggerResponse.json();
//           if (result?.output?.croppedImageUrl) {
//             return NextResponse.json({ croppedImageUrl: result.output.croppedImageUrl });
//           }
//         }
//       } catch (triggerError) {
//         console.warn('Trigger.dev crop failed, using fallback:', triggerError);
//       }
//     }

//     // Fallback: Server-side crop using canvas-like approach
//     // Fetch the image and extract crop region using sharp if available
//     try {
//       let imageBuffer: Buffer;

//       if (imageUrl.startsWith('data:')) {
//         const matches = imageUrl.match(/^data:[^;]+;base64,(.+)$/);
//         if (matches) {
//           imageBuffer = Buffer.from(matches[1], 'base64');
//         } else {
//           throw new Error('Invalid data URL');
//         }
//       } else {
//         const response = await fetch(imageUrl);
//         const arrayBuffer = await response.arrayBuffer();
//         imageBuffer = Buffer.from(arrayBuffer);
//       }

//       // Try to use sharp for server-side cropping
//       const sharp = await import('sharp').catch(() => null);

//       if (sharp) {
//         const image = sharp.default(imageBuffer);
//         const metadata = await image.metadata();

//         const cropX = Math.floor((metadata.width || 0) * ((x || 0) / 100));
//         const cropY = Math.floor((metadata.height || 0) * ((y || 0) / 100));
//         const cropWidth = Math.floor((metadata.width || 0) * ((width || 100) / 100));
//         const cropHeight = Math.floor((metadata.height || 0) * ((height || 100) / 100));

//         const croppedBuffer = await image
//           .extract({
//             left: Math.max(0, cropX),
//             top: Math.max(0, cropY),
//             width: Math.max(1, cropWidth),
//             height: Math.max(1, cropHeight),
//           })
//           .jpeg()
//           .toBuffer();

//         const base64 = croppedBuffer.toString('base64');
//         const croppedImageUrl = `data:image/jpeg;base64,${base64}`;

//         return NextResponse.json({ croppedImageUrl });
//       }

//       // If sharp isn't available, return the original image
//       const base64 = imageBuffer.toString('base64');
//       return NextResponse.json({
//         croppedImageUrl: `data:image/jpeg;base64,${base64}`,
//       });
//     } catch (fallbackError) {
//       console.error('Crop fallback error:', fallbackError);
//       // Last resort: return original image URL
//       return NextResponse.json({ croppedImageUrl: imageUrl });
//     }
//   } catch (error) {
//     console.error('Crop image error:', error);
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Crop failed' },
//       { status: 500 }
//     );
//   }
// }


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

    const { imageUrl, x, y, width, height } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // This endpoint is intentionally Trigger.dev-only.
    // If Trigger isn't configured, we want a loud failure (not a silent local crop).
    if (!process.env.TRIGGER_SECRET_KEY) {
      return NextResponse.json(
        { error: "Trigger.dev is not configured (missing TRIGGER_SECRET_KEY)" },
        { status: 503 }
      );
    }

    const run = await tasks.trigger("crop-image", {
      imageUrl,
      x: x || 0,
      y: y || 0,
      width: width || 100,
      height: height || 100,
    });

    // Poll for completion (up to ~20s)
    let output: any = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const status = await runs.retrieve(run.id);

      if (status.status === "COMPLETED") {
        output = status.output;
        break;
      }
      if (status.status === "FAILED") {
        throw new Error("Trigger.dev crop task failed");
      }
    }

    if (!output?.croppedImageUrl) {
      throw new Error("Crop task completed without croppedImageUrl");
    }

    // Trigger sometimes returns a data-url (base64). That's still "Trigger output" (not a local fallback),
    // but the UI can't really use it downstream, so we normalize it into a proper blob URL here.
    if (String(output.croppedImageUrl).startsWith("data:")) {
      const matches = String(output.croppedImageUrl).match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Trigger.dev returned an invalid data URL");
      }

      const mimeType = matches[1] || "image/jpeg";
      const base64 = matches[2];
      const buffer = Buffer.from(base64, "base64");

      const ext =
        mimeType === "image/png" ? "png" :
        mimeType === "image/webp" ? "webp" :
        "jpg";

      const blob = await put(
        `images/cropped/${userId}/cropped-${Date.now()}.${ext}`,
        buffer,
        {
          access: "public",
          contentType: mimeType,
        }
      );

      return NextResponse.json({ croppedImageUrl: blob.url });
    }

    return NextResponse.json({ croppedImageUrl: output.croppedImageUrl });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}