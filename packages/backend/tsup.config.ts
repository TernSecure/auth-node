import type { Options } from "tsup";
import { defineConfig } from "tsup";

import { runAfterLast } from '../../scripts/utils';
import { name, version } from "./package.json";

const config: Options = {
  entry: ['src/index.ts', 'src/admin/index.ts', 'src/auth/index.ts', 'src/jwt/index.ts'],
  onSuccess: `cpy 'src/runtime/**/*.{mjs,js,cjs}' dist/runtime`,
  bundle: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: ['#crypto', 'next', 'firebase-admin'],
  define: {
    PACKAGE_NAME: `"${name}"`,
    PACKAGE_VERSION: `"${version}"`,
  },
};

const esmConfig: Options = {
  ...config,
  format: "esm",
};

const cjsConfig: Options = {
  ...config,
  format: "cjs",
};

export default defineConfig(() => {
  return runAfterLast(['pnpm build:add'])(esmConfig, cjsConfig);
});
