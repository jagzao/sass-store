#!/usr/bin/env node

/**
 * Cost Monitoring Script - Cloudflare Worker compatible
 * Monitors usage and enforces budget thresholds
 */

const BUDGET_THRESHOLDS = {
  ECO_MODE: 50,      // 50% of budget
  WARNING: 80,       // 80% of budget
  FREEZE_MODE: 90,   // 90% of budget
  KILL_SWITCH: 100   // 100% of budget
};

const MONTHLY_BUDGET = 5.00; // $5 USD

async function gatherUsageMetrics() {
  const usage = {
    cloudRun: await getCloudRunUsage(),
    neonDb: await getNeonUsage(),
    cloudflareR2: await getR2Usage(),
    upstashRedis: await getUpstashUsage(),
    totalCost: 0
  };

  usage.totalCost = usage.cloudRun + usage.neonDb + usage.cloudflareR2 + usage.upstashRedis;

  return usage;
}

async function getCloudRunUsage() {
  // Simulate Cloud Run cost calculation
  // In production, this would use Google Cloud Billing API
  const requestCount = await getRequestCount();
  const cpuTime = await getCpuTime();

  // Cloud Run pricing: $0.40 per million requests + $0.0000024 per vCPU-second
  const requestCost = (requestCount / 1000000) * 0.40;
  const cpuCost = cpuTime * 0.0000024;

  return requestCost + cpuCost;
}

async function getNeonUsage() {
  // Simulate Neon database cost
  // Free tier: 0.5 GB storage, 5 compute hours
  const storageGB = await getDbStorageUsage();
  const computeHours = await getDbComputeUsage();

  const storageCost = Math.max(0, (storageGB - 0.5) * 0.10); // $0.10/GB after free tier
  const computeCost = Math.max(0, (computeHours - 5) * 0.16); // $0.16/hour after free tier

  return storageCost + computeCost;
}

async function getR2Usage() {
  // Simulate Cloudflare R2 cost
  const storageGB = await getR2StorageUsage();
  const operations = await getR2Operations();
  const egress = await getR2EgressUsage();

  const storageCost = storageGB * 0.015; // $0.015/GB/month
  const operationsCost = (operations / 1000000) * 0.36; // $0.36/million operations
  const egressCost = egress * 0.09; // $0.09/GB egress

  return storageCost + operationsCost + egressCost;
}

async function getUpstashUsage() {
  // Simulate Upstash Redis cost
  // Free tier: 10k commands/day
  const dailyCommands = await getRedisCommands();
  const excessCommands = Math.max(0, dailyCommands - 10000);

  return (excessCommands / 100000) * 0.20; // $0.20 per 100k commands
}

async function checkBudgetThresholds(usage) {
  const percentage = (usage.totalCost / MONTHLY_BUDGET) * 100;

  console.log(`Current usage: $${usage.totalCost.toFixed(4)} (${percentage.toFixed(1)}% of budget)`);

  if (percentage >= BUDGET_THRESHOLDS.KILL_SWITCH) {
    await activateKillSwitch();
    await sendAlert('CRITICAL', 'Kill switch activated - service scaled to zero', usage);
  } else if (percentage >= BUDGET_THRESHOLDS.FREEZE_MODE) {
    await activateFreezeMode();
    await sendAlert('WARNING', 'Freeze mode activated - read-only mode', usage);
  } else if (percentage >= BUDGET_THRESHOLDS.WARNING) {
    await sendAlert('WARNING', `${percentage.toFixed(1)}% of budget consumed`, usage);
  } else if (percentage >= BUDGET_THRESHOLDS.ECO_MODE) {
    await activateEcoMode();
    await sendAlert('INFO', 'Eco mode activated - reduced quality settings', usage);
  }

  return percentage;
}

async function activateEcoMode() {
  console.log('🟡 Activating eco mode...');

  // Set feature flags
  await setFeatureFlag('eco_mode', true);
  await setFeatureFlag('image_quality', 'low');
  await setFeatureFlag('cache_aggressive', true);

  // Scale down non-essential services
  await scaleService('api', { minInstances: 0, maxInstances: 1 });
}

async function activateFreezeMode() {
  console.log('🟠 Activating freeze mode...');

  // Set feature flags
  await setFeatureFlag('freeze_mode', true);
  await setFeatureFlag('read_only', true);
  await setFeatureFlag('uploads_disabled', true);

  // Scale down to minimum
  await scaleService('api', { minInstances: 0, maxInstances: 1 });
}

async function activateKillSwitch() {
  console.log('🔴 Activating kill switch...');

  // Set feature flags
  await setFeatureFlag('kill_switch', true);
  await setFeatureFlag('maintenance_mode', true);

  // Scale to zero
  await scaleService('api', { minInstances: 0, maxInstances: 0 });
}

async function sendAlert(level, message, usage) {
  const alert = {
    level,
    message,
    usage,
    timestamp: new Date().toISOString(),
    budget: MONTHLY_BUDGET
  };

  console.log(`📢 ALERT [${level}]: ${message}`);

  // Send to multiple channels
  await Promise.all([
    sendSlackAlert(alert),
    sendEmailAlert(alert),
    logAlert(alert)
  ]);
}

async function sendSlackAlert(alert) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const color = {
    'CRITICAL': '#ff0000',
    'WARNING': '#ffaa00',
    'INFO': '#00aa00'
  }[alert.level] || '#cccccc';

  const payload = {
    attachments: [{
      color,
      title: `Sass Store Cost Alert - ${alert.level}`,
      text: alert.message,
      fields: [
        {
          title: 'Current Cost',
          value: `$${alert.usage.totalCost.toFixed(4)}`,
          short: true
        },
        {
          title: 'Budget Used',
          value: `${((alert.usage.totalCost / alert.budget) * 100).toFixed(1)}%`,
          short: true
        }
      ],
      timestamp: alert.timestamp
    }]
  };

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack alert failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

async function sendEmailAlert(alert) {
  // Email alert implementation would go here
  console.log('📧 Email alert would be sent');
}

async function logAlert(alert) {
  // Log to centralized logging service
  console.log('📝 Alert logged:', JSON.stringify(alert, null, 2));
}

// Mock functions for demonstration
async function getRequestCount() { return Math.floor(Math.random() * 100000); }
async function getCpuTime() { return Math.random() * 3600; }
async function getDbStorageUsage() { return Math.random() * 2; }
async function getDbComputeUsage() { return Math.random() * 10; }
async function getR2StorageUsage() { return Math.random() * 5; }
async function getR2Operations() { return Math.floor(Math.random() * 50000); }
async function getR2EgressUsage() { return Math.random() * 10; }
async function getRedisCommands() { return Math.floor(Math.random() * 15000); }

async function setFeatureFlag(flag, value) {
  console.log(`🚩 Setting feature flag: ${flag} = ${value}`);
  // Implementation would update feature flag service
}

async function scaleService(service, config) {
  console.log(`📈 Scaling ${service}:`, config);
  // Implementation would call cloud provider APIs
}

// Main execution
async function main() {
  try {
    console.log('🔍 Starting cost monitoring check...');

    const usage = await gatherUsageMetrics();
    const budgetPercentage = await checkBudgetThresholds(usage);

    console.log('✅ Cost monitoring check completed');

    // Return usage for Cloudflare Worker or exit for Node.js
    if (typeof Response !== 'undefined') {
      return new Response(JSON.stringify({
        usage,
        budgetPercentage,
        status: 'ok'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Cost monitoring failed:', error);

    if (typeof Response !== 'undefined') {
      return new Response(JSON.stringify({
        error: error.message,
        status: 'error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      process.exit(1);
    }
  }
}

// Export for Cloudflare Workers or run directly
if (typeof addEventListener !== 'undefined') {
  addEventListener('scheduled', event => {
    event.waitUntil(main());
  });
} else {
  main();
}