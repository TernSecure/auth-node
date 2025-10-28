import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    env: {
      FIREBASE_PROJECTID: 'test-project',
      FIREBASE_CLIENTEMAIL: 'test@example.com',
      FIREBASE_PRIVATEKEY: 'test-private-key',
      TERNSECURE_API_URL: 'http://localhost:3000/api/auth/',
    },
    includeSource: ['**/*.{js,ts,jsx,tsx}'],
  },
});
