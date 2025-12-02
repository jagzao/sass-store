const { spawn } = require('child_process');

const child = spawn('cmd', ['/c', 'npx drizzle-kit push'], {
  cwd: 'c:/Dev/Zo/sass-store',
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Check if the output contains the confirmation prompt
  if (output.includes('❯ No, abort') && output.includes('Yes, I want to execute all statements')) {
    // Send the "Yes" response
    setTimeout(() => {
      child.stdin.write('Yes, I want to execute all statements\n');
    }, 1000);
  }
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});