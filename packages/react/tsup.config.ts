import { defineConfig } from 'tsup';
import { name, version } from './package.json';

export default defineConfig(() => {
  return {
    entry: [
      './src/**/*.{ts,tsx,js,jsx}'
    ],
    bundle: false,
    minify: true,
    clean: true,
    sourcemap: true,
    format: ['cjs', 'esm'],
    dts: true,
    external: [
    'react',
    'react-dom',
    'next',
    'firebase',
    'firebase-admin',
    '@tern-secure/types',
    '@tanstack/react-form',
    '@tern-secure/backend',
    '@tern-secure/shared',
  ],
  define: {
    __PACKAGE_NAME__: `"${name}"`,
    __PACKAGE_VERSION__: `"${version}"`
  },
  injectStyle: true,
  //onSuccess: 'pnpm build:styles'
  };
});