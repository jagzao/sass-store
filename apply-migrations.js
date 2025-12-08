const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'push'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

// Wait a bit for the prompt to appear, then send responses
setTimeout(() => {
  // Select first option (create enum) by pressing Enter
  child.stdin.write('\n');

  // Wait for more prompts and confirm
  setTimeout(() => {
    child.stdin.write('y\n'); // Confirm if asked
    child.stdin.end();
  }, 5000);
}, 5000);

child.on('close', (code) => {
  console.log(`Migration process exited with code ${code}`);
  process.exit(code);
});
