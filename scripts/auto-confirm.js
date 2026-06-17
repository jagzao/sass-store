const { spawn } = require('child_process');
const readline = require('readline');

// Spawn the npm process
const npmProcess = spawn('npm', ['run', 'db:push'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Create a readline interface to read from the process output
const rl = readline.createInterface({
  input: npmProcess.stdout,
  output: process.stdout,
  terminal: false
});

// Listen for output lines
rl.on('line', (line) => {
  console.log(line);
  
  // Check if the line contains the confirmation prompt
  if (line.includes('Yes, I want to execute all statements')) {
    // Send "y" to confirm
    npmProcess.stdin.write('y\n');
  }
});

// Listen for errors
npmProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Listen for process exit
npmProcess.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
  rl.close();
});