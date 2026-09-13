import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fastApiAutoLauncher() {
  let backendProcess = null;

  const isPortResponding = (host, port) => {
    return new Promise((resolve) => {
      const req = http.get({ host, port, path: '/health', timeout: 800 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  };

  return {
    name: 'fastapi-auto-launcher',
    async configureServer(server) {
      const alreadyRunning = (await isPortResponding('127.0.0.1', 8000)) || (await isPortResponding('localhost', 8000));
      if (alreadyRunning) {
        console.log('\x1b[32m%s\x1b[0m', '⚡ [FastAPI] Backend is already active on http://127.0.0.1:8000');
        return;
      }

      console.log('\x1b[36m%s\x1b[0m', '🚀 [FastAPI] Auto-starting NetraSaarthi AI Backend (port 8000)...');

      const workspaceRoot = path.resolve(__dirname, '..');
      const venvPython = path.join(workspaceRoot, 'backend', '.venv', 'Scripts', 'python.exe');
      const pythonExecutable = fs.existsSync(venvPython) ? venvPython : 'python';

      try {
        backendProcess = spawn(
          pythonExecutable,
          ['-m', 'uvicorn', 'backend.main:app', '--port', '8000', '--host', '127.0.0.1'],
          {
            cwd: workspaceRoot,
            stdio: 'pipe',
            shell: process.platform === 'win32',
            detached: false,
          }
        );

        backendProcess.stdout?.on('data', (data) => {
          const msg = data.toString();
          if (msg.includes('Application startup complete') || msg.includes('Uvicorn running')) {
            console.log('\x1b[32m%s\x1b[0m', '✓ [FastAPI] Server ready on http://127.0.0.1:8000');
          }
        });

        backendProcess.stderr?.on('data', (data) => {
          const msg = data.toString();
          if (!msg.includes('INFO:') && !msg.includes('StarletteDeprecationWarning')) {
            console.warn('\x1b[33m%s\x1b[0m', `[FastAPI Notice]: ${msg.trim()}`);
          }
        });

        backendProcess.on('error', (err) => {
          console.error('\x1b[31m%s\x1b[0m', `⚠️ Could not launch FastAPI: ${err.message}`);
        });

        const killBackend = () => {
          if (backendProcess) {
            try {
              if (process.platform === 'win32') {
                spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t']);
              } else {
                backendProcess.kill();
              }
            } catch (_) {}
            backendProcess = null;
          }
        };

        process.on('exit', killBackend);
        process.on('SIGINT', killBackend);
        process.on('SIGTERM', killBackend);
        server.httpServer?.on('close', killBackend);
      } catch (launchErr) {
        console.warn('FastAPI auto-launch caught exception:', launchErr.message);
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fastApiAutoLauncher()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/screenings': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/patients': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/doctors': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  }
});

