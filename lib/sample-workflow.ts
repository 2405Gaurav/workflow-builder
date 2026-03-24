import { WorkflowNode, WorkflowEdge } from './types';

/**
 * Product Marketing Generator - Sample Workflow
 * 
 * Branch A: Upload Image → Crop → Text (system) + Text (product) → LLM
 * Branch B: Upload Video → Extract Frame
 * Final: LLM Node takes output of Branch A + cropped image + extracted frame
 * Output: marketing post
 */
export const sampleWorkflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] } = {
  nodes: [
    // Branch A: Image processing
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
        x: 10,
        y: 10,
        width: 80,
        height: 80,
        status: 'idle',
      },
    },

    // Branch A: Text inputs
    {
      id: 'text-system',
      type: 'text',
      position: { x: 50, y: 250 },
      data: {
        label: 'text',
        type: 'text',
        outputType: 'text',
        text: 'You are a product marketing expert. Analyze images and text to create compelling marketing content.',
        status: 'idle',
      },
    },
    {
      id: 'text-product',
      type: 'text',
      position: { x: 50, y: 450 },
      data: {
        label: 'text',
        type: 'text',
        outputType: 'text',
        text: 'This is our latest premium wireless headphone. Key features: noise cancellation, 40hr battery, premium materials.',
        status: 'idle',
      },
    },

    // Branch A: First LLM
    {
      id: 'llm-analyzer',
      type: 'llm',
      position: { x: 750, y: 200 },
      data: {
        label: 'llm',
        type: 'llm',
        outputType: 'text',
        model: 'gemini-1.5-flash',
        systemPrompt: 'You are a product marketing expert.',
        userMessage: 'Based on the product image and description provided, create a detailed product analysis highlighting unique selling points, target audience, and key benefits.',
        status: 'idle',
      },
    },

    // Branch B: Video processing
    {
      id: 'upload-video-1',
      type: 'upload-video',
      position: { x: 50, y: 650 },
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
      position: { x: 400, y: 650 },
      data: {
        label: 'extract-frame',
        type: 'extract-frame',
        outputType: 'image',
        timestamp: 2.5,
        status: 'idle',
      },
    },

    // Final: Marketing post generator
    {
      id: 'llm-marketing',
      type: 'llm',
      position: { x: 1150, y: 350 },
      data: {
        label: 'llm',
        type: 'llm',
        outputType: 'text',
        model: 'gemini-1.5-pro',
        systemPrompt: 'You are a creative marketing copywriter specializing in social media campaigns.',
        userMessage: 'Using the product analysis and visual assets provided, create an engaging social media marketing post. Include:\n\n1. A catchy headline (emoji included)\n2. Compelling product description (2-3 sentences)\n3. Key feature highlights (bullet points)\n4. Call to action\n5. 5-7 relevant hashtags\n\nMake it feel premium and aspirational.',
        status: 'idle',
      },
    },
  ],
  edges: [
    // Branch A: Image → Crop
    {
      id: 'e-img-crop',
      source: 'upload-image-1',
      target: 'crop-image-1',
      animated: true,
    },
    // Branch A: Crop → LLM (image input)
    {
      id: 'e-crop-llm',
      source: 'crop-image-1',
      target: 'llm-analyzer',
      targetHandle: 'image-input',
      animated: true,
    },
    // Branch A: Text (product) → LLM (text input)
    {
      id: 'e-text-llm',
      source: 'text-product',
      target: 'llm-analyzer',
      targetHandle: 'text-input',
      animated: true,
    },
    // Branch B: Video → Extract Frame
    {
      id: 'e-vid-frame',
      source: 'upload-video-1',
      target: 'extract-frame-1',
      animated: true,
    },
    // Final: LLM Analyzer → Marketing LLM (text input)
    {
      id: 'e-analysis-marketing',
      source: 'llm-analyzer',
      target: 'llm-marketing',
      targetHandle: 'text-input',
      animated: true,
    },
    // Final: Extracted Frame → Marketing LLM (image input)
    {
      id: 'e-frame-marketing',
      source: 'extract-frame-1',
      target: 'llm-marketing',
      targetHandle: 'image-input',
      animated: true,
    },
  ],
};
