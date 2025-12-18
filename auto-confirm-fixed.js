const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');
const os = require('os');

// Determine the correct npm command based on the OS
const npmCommand = os.platform() === 'win32' ? 'npm.cmd' : 'npm';

// Spawn the npm process
const npmProcess = spawn(npmCommand, ['run', 'db:push'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
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

// Handle errors
npmProcess.on('error', (err) => {
  console.error('Failed to start subprocess.', err);
});