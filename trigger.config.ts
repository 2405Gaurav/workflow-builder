import { defineConfig } from '@trigger.dev/sdk/v3';
// Import ffmpeg instead of just aptGet
import { ffmpeg, aptGet } from '@trigger.dev/build/extensions/core'; 

export default defineConfig({
  project: 'proj_bzgjeuuxdfiuyqqnwlql',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 300,
  build: {
    extensions: [
      ffmpeg(), // This handles FFmpeg correctly on both Cloud and Local
      aptGet({ packages: ['libvips-dev'] }), // Keep this for your other dependencies
    ],
    // Add 'fluent-ffmpeg' to external to prevent bundling issues
    external: ['sharp', 'fluent-ffmpeg'], 
  },
  dirs: ['./trigger'],
});