import { spawn } from 'node:child_process';
import net from 'node:net';

function isAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findPort(start) {
  let port = start;
  while (port < start + 100) {
    if (await isAvailable(port)) return port;
    port++;
  }
  throw new Error(`No free port in range ${start}–${start + 99}`);
}

const basePort = parseInt(process.env.PORT ?? '3000', 10);
const port = await findPort(basePort);
const args = process.argv.slice(2);

if (port !== basePort) {
  console.log(`[web] port ${basePort} in use → using ${port}`);
}

const child = spawn('pnpm', ['exec', 'next', 'dev', '-p', String(port), ...args], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

child.on('exit', (code) => process.exit(code ?? 0));
