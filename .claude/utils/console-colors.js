const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
};

class ConsoleLogger {
  orchestrator(msg) {
    console.log(
      `${colors.bright}${colors.magenta}🎯 [ORCHESTRATOR]${colors.reset} ${msg}`
    );
  }
  developer(msg) {
    console.log(
      `${colors.bright}${colors.blue}💻 [DEVELOPER]${colors.reset} ${msg}`
    );
  }
  tester(msg) {
    console.log(
      `${colors.bright}${colors.cyan}🧪 [TESTER]${colors.reset} ${msg}`
    );
  }
  qa(msg) {
    console.log(
      `${colors.bright}${colors.yellow}🐛 [QA]${colors.reset} ${msg}`
    );
  }
  automation(msg) {
    console.log(
      `${colors.bright}${colors.green}⚙️  [AUTOMATION]${colors.reset} ${msg}`
    );
  }
  visual(msg) {
    console.log(
      `${colors.bright}${colors.magenta}🎨 [VISUAL]${colors.reset} ${msg}`
    );
  }
  architect(msg) {
    console.log(
      `${colors.bright}${colors.white}🏗️  [ARCHITECT]${colors.reset} ${msg}`
    );
  }

  success(msg) {
    console.log(`${colors.green}✓ ${msg}${colors.reset}`);
  }
  error(msg) {
    console.log(`${colors.red}✗ ${msg}${colors.reset}`);
  }
  warning(msg) {
    console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
  }
  info(msg) {
    console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`);
  }

  actionRequired(msg) {
    console.log(
      `\n${colors.bgYellow}${colors.bright} ⚠️  ACCIÓN REQUERIDA ⚠️  ${colors.reset}`
    );
    console.log(`${colors.yellow}${colors.bright}${msg}${colors.reset}\n`);
  }

  banner(title) {
    console.log(`\n${colors.bgBlue}${colors.white}${colors.bright}`);
    console.log(`┌${"─".repeat(78)}┐`);
    console.log(
      `│${" ".repeat(Math.floor((78 - title.length) / 2))}${title}${" ".repeat(Math.ceil((78 - title.length) / 2))}│`
    );
    console.log(`└${"─".repeat(78)}┘${colors.reset}\n`);
  }

  separator() {
    console.log(`${colors.dim}${"─".repeat(80)}${colors.reset}`);
  }

  progress(current, total, agent) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round(percentage / 5);
    const bar = "█".repeat(filled) + "░".repeat(20 - filled);
    console.log(
      `${colors.cyan}[${agent}] ${bar} ${percentage}%${colors.reset}`
    );
  }
}

module.exports = new ConsoleLogger();
