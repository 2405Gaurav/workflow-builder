import { task } from "@trigger.dev/sdk/v3";

export const executeLLMTask = task({
  id: "execute-llm",
  run: async (payload: {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    images?: string[];
  }) => {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    // Ensure we use a valid model name (Fixing the 404)
    const modelId = payload.model.includes("2.5") ? "gemini-2.5-flash" : payload.model;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: payload.systemPrompt,
    });

    const parts: any[] = [{ text: payload.userMessage }];

    if (payload.images && payload.images.length > 0) {
      for (const imageUrl of payload.images) {
        if (imageUrl.startsWith("data:")) {
          // Handle Base64
          const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: { data: matches[2], mimeType: matches[1] },
            });
          }
        } else {
          // Handle Remote URL
          const response = await fetch(imageUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = response.headers.get("content-type") || "image/jpeg";
          
          parts.push({
            inlineData: { data: base64, mimeType: contentType },
          });
        }
      }
    }

    const result = await model.generateContent(parts);
    return { text: result.response.text() };
  },
});


export const cropImageTask = task({
  id: "crop-image",
  run: async (payload: { imageUrl: string; x: number; y: number; width: number; height: number }) => {
    // Import sharp inside the task
    const sharp = (await import("sharp")).default;
    
    let imageBuffer: Buffer;
    if (payload.imageUrl.startsWith("data:")) {
      const matches = payload.imageUrl.match(/^data:[^;]+;base64,(.+)$/);
      imageBuffer = Buffer.from(matches![1], "base64");
    } else {
      const response = await fetch(payload.imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Calculate pixel values based on percentages
    const left = Math.floor((metadata.width || 0) * (payload.x / 100));
    const top = Math.floor((metadata.height || 0) * (payload.y / 100));
    const width = Math.floor((metadata.width || 0) * (payload.width / 100));
    const height = Math.floor((metadata.height || 0) * (payload.height / 100));

    const croppedBuffer = await image
      .extract({ 
        left: Math.max(0, left), 
        top: Math.max(0, top), 
        width: Math.max(1, width), 
        height: Math.max(1, height) 
      })
      .jpeg()
      .toBuffer();

    return {
      croppedImageUrl: `data:image/jpeg;base64,${croppedBuffer.toString("base64")}`,
    };
  },
});

// export const extractFrameTask = task({
//   id: 'extract-frame',
//   run: async (payload: {
//     videoUrl: string;
//     timestamp: number;
//   }) => {
//     const ffmpeg = await import('fluent-ffmpeg');
//     const fs = await import('fs');
//     const path = await import('path');
//     const { promisify } = await import('util');

//     const writeFile = promisify(fs.writeFile);
//     const unlink = promisify(fs.unlink);

//     const tempVideoPath = path.join('/tmp', `video-${Date.now()}.mp4`);
//     const tempFramePath = path.join('/tmp', `frame-${Date.now()}.jpg`);

//     const videoResponse = await fetch(payload.videoUrl);
//     const videoBuffer = await videoResponse.arrayBuffer();
//     await writeFile(tempVideoPath, new Uint8Array(videoBuffer));

//     return new Promise((resolve, reject) => {
//       ffmpeg.default(tempVideoPath)
//         .screenshots({
//           timestamps: [payload.timestamp],
//           filename: path.basename(tempFramePath),
//           folder: path.dirname(tempFramePath),
//         })
//         .on('end', async () => {
//           try {
//             const frameBuffer = await fs.promises.readFile(tempFramePath);
//             const base64 = frameBuffer.toString('base64');
//             const frameUrl = `data:image/jpeg;base64,${base64}`;

//             await unlink(tempVideoPath);
//             await unlink(tempFramePath);

//             resolve({ frameUrl });
//           } catch (error) {
//             reject(error);
//           }
//         })
//         .on('error', reject);
//     });
//   },
// });





export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: { videoUrl: string; timestamp?: number }) => {
    // 1. DYNAMIC IMPORTS
    const ffmpeg = (await import("fluent-ffmpeg")).default;
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");

    // 2. SET UP FFMPEG PATH
    // The Trigger.dev ffmpeg() extension automatically sets the FFMPEG_PATH environment variable.
    // Locally on Windows, it will fall back to the "ffmpeg" command you added to your System Path.
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    ffmpeg.setFfmpegPath(ffmpegPath);

    // 3. PREPARE TEMP FILES
    const runId = Math.random().toString(36).substring(7);
    const tempDir = path.join(os.tmpdir(), `extract-${runId}`);
    await fs.mkdir(tempDir, { recursive: true });

    const videoPath = path.join(tempDir, "input_video.mp4");
    const framePath = path.join(tempDir, "output_frame.jpg");

    try {
      // 4. HANDLE VIDEO DATA
      let videoBuffer: Buffer;
      if (payload.videoUrl.startsWith("data:")) {
        const match = payload.videoUrl.match(/^data:video\/\w+;base64,(.+)$/);
        if (!match) throw new Error("Invalid base64 video format");
        videoBuffer = Buffer.from(match[1], "base64");
      } else {
        const res = await fetch(payload.videoUrl);
        if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
        videoBuffer = Buffer.from(await res.arrayBuffer());
      }

      // Write video to temp file
      await fs.writeFile(videoPath, new Uint8Array(videoBuffer));

      // 5. EXTRACT FRAME
      // Using .seekInput() before the input is much faster than .screenshots()
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(payload.timestamp ?? 0) // Fast seek to timestamp
          .frames(1)                         // Extract only 1 frame
          .output(framePath)
          .on("end", () => resolve())
          .on("error", (err: any) => {
            console.error("FFmpeg Error:", err.message);
            reject(new Error(`FFmpeg failed: ${err.message}`));
          })
          .run();
      });

      // 6. RETURN RESULT
      const frameBuffer = await fs.readFile(framePath);
      return {
        frameUrl: `data:image/jpeg;base64,${frameBuffer.toString("base64")}`,
      };

    } finally {
      // 7. CLEANUP
      // Clean up the entire temporary directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  },
});