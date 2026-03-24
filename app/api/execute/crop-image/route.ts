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

    // ==============================
    // ✅ 1. Trigger.dev (PRIMARY)
    // ==============================
    if (process.env.TRIGGER_SECRET_KEY) {
      try {
        // Trigger the "crop-image" task defined in your trigger/ folder
        const run = await tasks.trigger("crop-image", {
          imageUrl,
          x: x || 0,
          y: y || 0,
          width: width || 100,
          height: height || 100,
        });

        let output: any = null;

        // Poll for completion (similar to your extract-frame logic)
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

        if (output?.croppedImageUrl) {
          return NextResponse.json({ croppedImageUrl: output.croppedImageUrl });
        }
      } catch (err) {
        console.warn("Trigger.dev crop failed → switching to fallback:", err);
      }
    }

    // ==============================
    // ✅ 2. LOCAL FALLBACK
    // ==============================
    // (Keep your existing sharp fallback logic here just in case)
    try {
      const sharp = (await import("sharp")).default;
      let imageBuffer: Buffer;

      if (imageUrl.startsWith("data:")) {
        const matches = imageUrl.match(/^data:[^;]+;base64,(.+)$/);
        imageBuffer = Buffer.from(matches![1], "base64");
      } else {
        const response = await fetch(imageUrl);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      }

      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      const croppedBuffer = await image
        .extract({
          left: Math.floor((metadata.width || 0) * ((x || 0) / 100)),
          top: Math.floor((metadata.height || 0) * ((y || 0) / 100)),
          width: Math.floor((metadata.width || 0) * ((width || 100) / 100)),
          height: Math.floor((metadata.height || 0) * ((height || 100) / 100)),
        })
        .toBuffer();

      return NextResponse.json({
        croppedImageUrl: `data:image/jpeg;base64,${croppedBuffer.toString("base64")}`,
      });
    } catch (fallbackError) {
      console.error("Crop fallback error:", fallbackError);
      return NextResponse.json({ croppedImageUrl: imageUrl });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}