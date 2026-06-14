const cluster = require("cluster");
const os = require("os");

const numWorkers = process.env.CLUSTER_WORKERS
  ? parseInt(process.env.CLUSTER_WORKERS)
  : os.cpus().length;

if (cluster.isPrimary) {
  console.log(`\n🚀 Master process starting (PID: ${process.pid})`);
  console.log(`   Spawning ${numWorkers} worker processes...\n`);

  // Spawn workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  // Auto-restart crashed workers
  cluster.on("exit", (worker, code, signal) => {
    if (signal !== "SIGTERM" && signal !== "SIGINT") {
      console.warn(
        `⚠️  Worker ${worker.process.pid} died (${signal || code}) — restarting...`,
      );
      cluster.fork();
    }
  });

  cluster.on("online", (worker) => {
    console.log(`  ✅ Worker ${worker.process.pid} ready`);
  });

  // Graceful shutdown on master
  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.on(signal, () => {
      console.log(`\n📦 ${signal} received — stopping all workers...`);
      for (const id in cluster.workers) {
        cluster.workers[id].kill(signal);
      }
      setTimeout(() => process.exit(0), 5000);
    });
  });
} else {
  // Worker process — load the app
  require("./app");
}
