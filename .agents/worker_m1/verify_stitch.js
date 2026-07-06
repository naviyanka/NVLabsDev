const { spawn } = require('child_process');
const readline = require('readline');

// Command to spawn
const cmd = 'npx';
const args = [
  '-y',
  'mcp-remote',
  'https://stitch.googleapis.com/mcp',
  '--header',
  '"X-Goog-Api-Key: AQ.Ab8RN6LX32fyNsskFevnVsGjrfKoVZgwB8E5Xd5qYaV6glT1iw"'
];

const child = spawn(cmd, args, { shell: true });

const rl = readline.createInterface({
  input: child.stdout,
  terminal: false
});

child.stderr.on('data', (data) => {
  console.error(`[Stderr]: ${data.toString()}`);
});

let requestCounter = 1;
const pendingRequests = new Map();

function sendRequest(method, params) {
  const id = requestCounter++;
  const payload = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  const jsonStr = JSON.stringify(payload) + '\n';
  child.stdin.write(jsonStr);
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
  });
}

function sendNotification(method, params) {
  const payload = {
    jsonrpc: '2.0',
    method,
    params
  };
  const jsonStr = JSON.stringify(payload) + '\n';
  child.stdin.write(jsonStr);
}

rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    if (response.id && pendingRequests.has(response.id)) {
      const { resolve } = pendingRequests.get(response.id);
      pendingRequests.delete(response.id);
      resolve(response);
    }
  } catch (e) {
    console.error('Failed to parse line:', line, e);
  }
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
  process.exit(code);
});

async function main() {
  console.log('Sending initialize...');
  const initRes = await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'verify-script',
      version: '1.0.0'
    }
  });
  console.log('Initialize Response:', JSON.stringify(initRes, null, 2));

  sendNotification('notifications/initialized', {});
  console.log('Sent notifications/initialized.');

  console.log('Calling list_projects...');
  const listProjectsRes = await sendRequest('tools/call', {
    name: 'list_projects',
    arguments: {}
  });
  console.log('list_projects Response:', JSON.stringify(listProjectsRes, null, 2));

  console.log('Calling list_design_systems for project 3025252520653166800...');
  const listDesignSystemsRes = await sendRequest('tools/call', {
    name: 'list_design_systems',
    arguments: {
      projectId: '3025252520653166800'
    }
  });
  console.log('list_design_systems Response:', JSON.stringify(listDesignSystemsRes, null, 2));

  // Exit cleanly
  child.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  child.kill();
  process.exit(1);
});
