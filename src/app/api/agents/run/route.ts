import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextResponse } from 'next/server';

type AgentName =
  | 'scout'
  | 'research'
  | 'writer'
  | 'editor'
  | 'publisher'
  | 'ux'
  | 'loops'
  | 'curator'
  | 'orchestrator';

type RunRequestBody = {
  agent?: AgentName;
  action?: string;
};

const AGENT_MAP: Record<AgentName, string> = {
  scout: 'scout-agent.mjs',
  research: 'research-agent.mjs',
  writer: 'writer-agent.mjs',
  editor: 'editor-agent.mjs',
  publisher: 'publisher-agent.mjs',
  ux: 'ux-agent.mjs',
  loops: 'loops-agent.mjs',
  curator: 'curator-agent.mjs',
  orchestrator: 'orchestrator.mjs',
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as RunRequestBody;
    const agent = body?.agent;
    const action = typeof body?.action === 'string' ? body.action : undefined;

    if (!agent || !(agent in AGENT_MAP)) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), 'automation', 'agents', AGENT_MAP[agent]);
    const args = agent === 'orchestrator' ? [action || 'daily'] : [];

    return await new Promise<Response>((resolve) => {
      const child = spawn('node', [scriptPath, ...args], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let settled = false;
      let stdout = '';
      let stderr = '';

      const finish = (response: Response) => {
        if (settled) return;
        settled = true;
        resolve(response);
      };

      const abortListener = () => {
        if (settled) return;
        child.kill('SIGTERM');
      };
      request.signal.addEventListener('abort', abortListener);

      child.stdout.on('data', (data: Buffer | string) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer | string) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        request.signal.removeEventListener('abort', abortListener);
        finish(
          NextResponse.json({
            success: code === 0,
            agent,
            action,
            exitCode: code,
            output: stdout.substring(0, 5000),
            error: stderr.substring(0, 2000),
          })
        );
      });

      child.on('error', (error: Error) => {
        request.signal.removeEventListener('abort', abortListener);
        finish(
          NextResponse.json(
            {
              success: false,
              agent,
              error: error.message,
            },
            { status: 500 }
          )
        );
      });

      setTimeout(() => {
        if (settled) return;
        child.kill();
        finish(
          NextResponse.json(
            {
              success: false,
              agent,
              error: 'Timeout - process killed after 15 minutes',
            },
            { status: 504 }
          )
        );
      }, 900_000);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
