const { spawn } = require('child_process');
const path = require('path');

// Monolith-only: Run migrations from the root directory
const child = spawn('npx', ['drizzle-kit', 'generate'], {
  stdio: 'pipe',
  shell: true
});

// Automatically select the first option (create column) for all prompts
child.stdout.on('data', (data) => {
  console.log(data.toString());
  if (data.toString().includes('column in')) {
    child.stdin.write('\n'); // Select first option
  }
});

child.stderr.on('data', (data) => {
  console.error(data.toString());
});

child.on('close', (code) => {
  console.log(`Migration generation completed with code ${code}`);
});

child.stdin.write('\n'); // Initial enter to start
