import { task } from "@trigger.dev/sdk/v3";
import { put } from "@vercel/blob";

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
//   id: "extract-frame",
//   run: async (payload: { videoUrl: string; timestamp?: number }) => {
//     // 1. DYNAMIC IMPORTS
//     const ffmpeg = (await import("fluent-ffmpeg")).default;
//     const fs = await import("fs/promises");
//     const path = await import("path");
//     const os = await import("os");

//     // 2. SET UP FFMPEG PATH
//     // The Trigger.dev ffmpeg() extension automatically sets the FFMPEG_PATH environment variable.
//     // Locally on Windows, it will fall back to the "ffmpeg" command you added to your System Path.
//     const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
//     ffmpeg.setFfmpegPath(ffmpegPath);

//     // 3. PREPARE TEMP FILES
//     const runId = Math.random().toString(36).substring(7);
//     const tempDir = path.join(os.tmpdir(), `extract-${runId}`);
//     await fs.mkdir(tempDir, { recursive: true });

//     const videoPath = path.join(tempDir, "input_video.mp4");
//     const framePath = path.join(tempDir, "output_frame.jpg");

//     try {
//       // 4. HANDLE VIDEO DATA
//       let videoBuffer: Buffer;
//       if (payload.videoUrl.startsWith("data:")) {
//         const match = payload.videoUrl.match(/^data:video\/\w+;base64,(.+)$/);
//         if (!match) throw new Error("Invalid base64 video format");
//         videoBuffer = Buffer.from(match[1], "base64");
//       } else {
//         const res = await fetch(payload.videoUrl);
//         if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
//         videoBuffer = Buffer.from(await res.arrayBuffer());
//       }

//       // Write video to temp file
//       await fs.writeFile(videoPath, new Uint8Array(videoBuffer));

//       // 5. EXTRACT FRAME
//       // Using .seekInput() before the input is much faster than .screenshots()
//       await new Promise<void>((resolve, reject) => {
//         ffmpeg(videoPath)
//           .seekInput(payload.timestamp ?? 0) // Fast seek to timestamp
//           .frames(1)                         // Extract only 1 frame
//           .output(framePath)
//           .on("end", () => resolve())
//           .on("error", (err: any) => {
//             console.error("FFmpeg Error:", err.message);
//             reject(new Error(`FFmpeg failed: ${err.message}`));
//           })
//           .run();
//       });

//       // 6. RETURN RESULT
//       const frameBuffer = await fs.readFile(framePath);
//       return {
//         frameUrl: `data:image/jpeg;base64,${frameBuffer.toString("base64")}`,
//       };

//     } finally {
//       // 7. CLEANUP
//       // Clean up the entire temporary directory
//       await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
//     }
//   },
// });




export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: { videoUrl: string; timestamp?: any }) => {
    const ffmpeg = (await import("fluent-ffmpeg")).default;
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");

    const seekTime = parseFloat(String(payload.timestamp || 0));

    const runId = Math.random().toString(36).substring(7);
    const tempDir = path.join(os.tmpdir(), `extract-${runId}`);
    await fs.mkdir(tempDir, { recursive: true });

    const videoPath = path.join(tempDir, "input_video.mp4");
    const framePath = path.join(tempDir, "output_frame.jpg");

    try {
      const videoResponse = await fetch(payload.videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
      }
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
      // await fs.writeFile(videoPath, videoBuffer);
         await fs.writeFile(videoPath, new Uint8Array(videoBuffer));

      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seek(seekTime)
          .frames(1)
          .output(framePath)
          .outputOptions('-y')
          .on("end", resolve)
          .on("error", (err: Error, stdout: string, stderr: string) => {
            console.error("FFmpeg Stderr:", stderr);
            reject(new Error(`FFmpeg failed: ${err.message}`));
          })
          .run();
      });

      const frameBuffer = await fs.readFile(framePath);
      const blob = await put(`frames/frame-${Date.now()}.jpg`, frameBuffer, {
        access: "public",
        contentType: "image/jpeg",
      });

      return { frameUrl: blob.url };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  },
});