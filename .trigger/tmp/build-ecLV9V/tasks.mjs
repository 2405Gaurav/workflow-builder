import {
  task
} from "./chunk-7O3HWOEK.mjs";
import "./chunk-Q63KMMEI.mjs";
import {
  __name,
  init_esm
} from "./chunk-GOSPV2DU.mjs";

// trigger/tasks.ts
init_esm();
var executeLLMTask = task({
  id: "execute-llm",
  run: /* @__PURE__ */ __name(async (payload) => {
    const { GoogleGenerativeAI } = await import("./dist-PY5SJJEZ.mjs");
    const modelId = payload.model.includes("2.5") ? "gemini-2.5-flash" : payload.model;
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: payload.systemPrompt
    });
    const parts = [{ text: payload.userMessage }];
    if (payload.images && payload.images.length > 0) {
      for (const imageUrl of payload.images) {
        if (imageUrl.startsWith("data:")) {
          const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            parts.push({
              inlineData: { data: matches[2], mimeType: matches[1] }
            });
          }
        } else {
          const response = await fetch(imageUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = response.headers.get("content-type") || "image/jpeg";
          parts.push({
            inlineData: { data: base64, mimeType: contentType }
          });
        }
      }
    }
    const result = await model.generateContent(parts);
    return { text: result.response.text() };
  }, "run")
});
var cropImageTask = task({
  id: "crop-image",
  run: /* @__PURE__ */ __name(async (payload) => {
    const sharp = (await import("sharp")).default;
    let imageBuffer;
    if (payload.imageUrl.startsWith("data:")) {
      const matches = payload.imageUrl.match(/^data:[^;]+;base64,(.+)$/);
      imageBuffer = Buffer.from(matches[1], "base64");
    } else {
      const response = await fetch(payload.imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const left = Math.floor((metadata.width || 0) * (payload.x / 100));
    const top = Math.floor((metadata.height || 0) * (payload.y / 100));
    const width = Math.floor((metadata.width || 0) * (payload.width / 100));
    const height = Math.floor((metadata.height || 0) * (payload.height / 100));
    const croppedBuffer = await image.extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: Math.max(1, width),
      height: Math.max(1, height)
    }).jpeg().toBuffer();
    return {
      croppedImageUrl: `data:image/jpeg;base64,${croppedBuffer.toString("base64")}`
    };
  }, "run")
});
var extractFrameTask = task({
  id: "extract-frame",
  run: /* @__PURE__ */ __name(async (payload) => {
    const ffmpeg = (await import("fluent-ffmpeg")).default;
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    ffmpeg.setFfmpegPath(ffmpegPath);
    const runId = Math.random().toString(36).substring(7);
    const tempDir = path.join(os.tmpdir(), `extract-${runId}`);
    await fs.mkdir(tempDir, { recursive: true });
    const videoPath = path.join(tempDir, "input_video.mp4");
    const framePath = path.join(tempDir, "output_frame.jpg");
    try {
      let videoBuffer;
      if (payload.videoUrl.startsWith("data:")) {
        const match = payload.videoUrl.match(/^data:video\/\w+;base64,(.+)$/);
        if (!match) throw new Error("Invalid base64 video format");
        videoBuffer = Buffer.from(match[1], "base64");
      } else {
        const res = await fetch(payload.videoUrl);
        if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
        videoBuffer = Buffer.from(await res.arrayBuffer());
      }
      await fs.writeFile(videoPath, new Uint8Array(videoBuffer));
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath).seekInput(payload.timestamp ?? 0).frames(1).output(framePath).on("end", () => resolve()).on("error", (err) => {
          console.error("FFmpeg Error:", err.message);
          reject(new Error(`FFmpeg failed: ${err.message}`));
        }).run();
      });
      const frameBuffer = await fs.readFile(framePath);
      return {
        frameUrl: `data:image/jpeg;base64,${frameBuffer.toString("base64")}`
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {
      });
    }
  }, "run")
});
export {
  cropImageTask,
  executeLLMTask,
  extractFrameTask
};
//# sourceMappingURL=tasks.mjs.map
