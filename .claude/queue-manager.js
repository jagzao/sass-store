const fs = require("fs").promises;
const path = require("path");
const logger = require("./utils/console-colors");

class QueueManager {
  constructor() {
    this.queueFile = path.join(
      process.cwd(),
      ".claude",
      "execution-queue.json"
    );
    this.stateFile = path.join(
      process.cwd(),
      ".claude",
      "execution-state.json"
    );
  }

  async initialize() {
    try {
      await fs.access(this.queueFile);
    } catch {
      await this.saveQueue({ tasks: [], currentTask: null });
    }

    try {
      await fs.access(this.stateFile);
    } catch {
      await this.saveState({
        lastExecution: null,
        totalExecutionTime: 0,
        remainingTime: 5 * 60 * 60,
      });
    }
  }

  async addTask(task) {
    const queue = await this.loadQueue();
    const newTask = {
      id: Date.now().toString(),
      ...task,
      status: "pending",
      createdAt: new Date().toISOString(),
      priority: task.priority || "normal",
    };

    queue.tasks.push(newTask);
    queue.tasks.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    await this.saveQueue(queue);
    logger.success(`Tarea agregada: ${newTask.name}`);
    return newTask.id;
  }

  async getNextTask() {
    const queue = await this.loadQueue();
    const nextTask = queue.tasks.find((t) => t.status === "pending");
    if (nextTask) {
      nextTask.status = "in_progress";
      nextTask.startedAt = new Date().toISOString();
      queue.currentTask = nextTask.id;
      await this.saveQueue(queue);
    }
    return nextTask;
  }

  async loadQueue() {
    const data = await fs.readFile(this.queueFile, "utf8");
    return JSON.parse(data);
  }

  async saveQueue(queue) {
    await fs.writeFile(this.queueFile, JSON.stringify(queue, null, 2));
  }

  async loadState() {
    const data = await fs.readFile(this.stateFile, "utf8");
    return JSON.parse(data);
  }

  async saveState(state) {
    state.lastExecution = new Date().toISOString();
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
  }
}

module.exports = new QueueManager();
