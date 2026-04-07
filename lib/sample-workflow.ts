import { WorkflowNode, WorkflowEdge } from './types';

/**
 * Product Marketing Generator - Sample Workflow
 *
 * Branch A: Upload Image → Crop Image → (Text #1 as system_prompt, Text #2 as user_message, Cropped Image) → LLM Node #1
 * Branch B: Upload Video → Extract Frame (at 50%)
 * Convergence: LLM Node #2 waits for BOTH branches
 *   - system_prompt ← Text Node #3
 *   - user_message  ← LLM Node #1 output
 *   - images        ← Cropped Image (Branch A) + Extracted Frame (Branch B)
 * Output: Final marketing tweet/post
 */
export const sampleWorkflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
  nodes: [
    // ── Branch A ─────────────────────────────────────────────
    {
      id: 'upload-image-1',
      type: 'upload-image',
      position: { x: 50, y: 50 },
      data: {
        label: 'upload-image',
        type: 'upload-image',
        outputType: 'image',
        status: 'idle',
      },
    },
    {
      id: 'crop-image-1',
      type: 'crop-image',
      position: { x: 400, y: 50 },
      data: {
        label: 'crop-image',
        type: 'crop-image',
        outputType: 'image',
        // centre crop at 80 % width/height as per spec
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        status: 'idle',
      },
    },

    // Text Node #1 — system prompt for LLM #1
    {
      id: 'text-system-1',
      type: 'text',
      position: { x: 50, y: 280 },
      data: {
        label: 'text',
        type: 'text',
        outputType: 'text',
        text: 'You are a professional marketing copywriter. Generate a compelling one-paragraph product description.',
        status: 'idle',
      },
    },

    // Text Node #2 — product details / user message for LLM #1
    {
      id: 'text-product-2',
      type: 'text',
      position: { x: 50, y: 480 },
      data: {
        label: 'text',
        type: 'text',
        outputType: 'text',
        text: 'Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.',
        status: 'idle',
      },
    },

    // LLM Node #1 — product description generator (Branch A convergence)
  // LLM Node #1 — product description generator (Branch A convergence)
    {
      id: 'llm-analyzer',
      type: 'llm',
      position: { x: 750, y: 220 },
      data: {
        label: 'llm',
        type: 'llm',
        outputType: 'text',
        model: 'gemini-2.5-flash',
        userMessage: 'Based on the product image and description provided, generate a compelling one-paragraph product description highlighting key features and benefits.',
        status: 'idle',
      },
    },

    // ── Branch B ─────────────────────────────────────────────
    {
      id: 'upload-video-1',
      type: 'upload-video',
      position: { x: 50, y: 700 },
      data: {
        label: 'upload-video',
        type: 'upload-video',
        outputType: 'video',
        status: 'idle',
      },
    },
   {
      id: 'extract-frame-1',
      type: 'extract-frame',
      position: { x: 400, y: 700 },
      data: {
        label: 'extract-frame',
        type: 'extract-frame',
        outputType: 'image',
        timestamp: 0.5,   // 0.5 = 50% as a number ratio, not a string
        status: 'idle',
      },
    },

    // Text Node #3 — system prompt for the convergence LLM #2
    {
      id: 'text-system-3',
      type: 'text',
      position: { x: 750, y: 620 },
      data: {
        label: 'text',
        type: 'text',
        outputType: 'text',
        text: 'You are a senior social media manager and brand strategist. Write like you actually ship campaigns. Use the TWO images provided as visual context, and be specific about what you see (but dont invent wild details).',
        status: 'idle',
      },
    },

    // ── Convergence ───────────────────────────────────────────
  // LLM Node #2 — final marketing post (waits for BOTH branches)
    {
      id: 'llm-marketing',
      type: 'llm',
      position: { x: 1150, y: 400 },
      data: {
        label: 'llm',
        type: 'llm',
        outputType: 'text',
        model: 'gemini-2.5-flash',
        userMessage: `Create a high quality, detailed social post package for this product based on:
1) the product description text coming from the previous LLM node
2) the two images you receive (cropped product photo + extracted video frame)

Output format:
- Hook headline (1 line)
- Main caption (8–14 lines, punchy but premium)
- 5 feature bullets (short)
- CTA line
- Hashtags (8–12, relevant, not cringe)
- 3 alt caption variations (short)

Make it feel like a real senior marketer wrote it. Keep it concrete and aligned with what the visuals show.`,
        status: 'idle',
      },
    },
  ],

  edges: [
    // ── Branch A ─────────────────────────────────────────────
    // Upload Image → Crop Image
    {
      id: 'e-img-crop',
      source: 'upload-image-1',
      target: 'crop-image-1',
      animated: true,
    },
    // Crop Image → LLM #1  (image input)
    {
      id: 'e-crop-llm1-image',
      source: 'crop-image-1',
      target: 'llm-analyzer',
      targetHandle: 'image-input',
      animated: true,
    },
    // Text #1 → LLM #1  (system_prompt)
    {
      id: 'e-text1-llm1-system',
      source: 'text-system-1',
      target: 'llm-analyzer',
      targetHandle: 'system-prompt-input',
      animated: true,
    },
    // Text #2 → LLM #1  (user_message)
    {
      id: 'e-text2-llm1-user',
      source: 'text-product-2',
      target: 'llm-analyzer',
      targetHandle: 'text-input',
      animated: true,
    },

    // ── Branch B ─────────────────────────────────────────────
    // Upload Video → Extract Frame
    {
      id: 'e-vid-frame',
      source: 'upload-video-1',
      target: 'extract-frame-1',
      animated: true,
    },

    // ── Convergence ───────────────────────────────────────────
    // Text #3 → LLM #2  (system_prompt)
    {
      id: 'e-text3-llm2-system',
      source: 'text-system-3',
      target: 'llm-marketing',
      targetHandle: 'system-prompt-input',
      animated: true,
    },
    // LLM #1 output → LLM #2  (user_message)
    {
      id: 'e-llm1-llm2-user',
      source: 'llm-analyzer',
      target: 'llm-marketing',
      targetHandle: 'text-input',
      animated: true,
    },
    // Cropped Image (Branch A) → LLM #2  (image input #1)
// Cropped Image (Branch A) → LLM #2  (image input #1)
{
  id: 'e-crop-llm2-image',
  source: 'crop-image-1',
  target: 'llm-marketing',
  targetHandle: 'image-input',   // ← keep as-is
  animated: true,
},
// Extracted Frame (Branch B) → LLM #2  (image input #2)
{
  id: 'e-frame-llm2-image',
  source: 'extract-frame-1',
  target: 'llm-marketing',
  targetHandle: 'image-input-2', // ← already different ✅
  animated: true,
},
  ],
};