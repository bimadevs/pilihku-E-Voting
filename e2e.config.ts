import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export default {
  timeout: 180_000,
  agents: {
    default: {
      judgmentTimeout: 90_000,
      model: createOpenAICompatible({
        name: 'openai-compatible',
        baseURL: 'http://localhost:20128/v1',
        fetch: async (url, options) => {
          const res = await fetch(url, options);
          const text = await res.text();
          const cleanText = text.replace(/data:\s*\[DONE\]\s*$/, '').trim();
          return new Response(cleanText, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        },
      }).chatModel('kc/minimax/minimax-m3.1-flash:free'),
      system: 'You are a thorough QA agent. Verify every outcome.',
    },
  },
  targets: [{
    engine: web(),
    app: {
      url: process.env.APP_URL ?? 'http://localhost:3000',
      command: {
        executable: 'npm',
        args: ['run', 'dev'],
        startupTimeout: 120_000,
        log: '.e2e/logs/app.log',
        reuseExisting: true,
      },
    },
  }],
} satisfies E2EConfig;
