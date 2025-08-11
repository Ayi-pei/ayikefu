import { defineConfig } from 'vite';
import path from 'path';
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/embed.js'),
      name: 'ChatEmbed',
      fileName: 'embed'
    },
    rollupOptions: {
      output: { assetFileNames: `assets/[name].[hash][extname]` }
    }
  }
});
