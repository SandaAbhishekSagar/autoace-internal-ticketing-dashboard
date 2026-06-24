const { execSync } = require("child_process");

const FAILED_MIGRATION = "20260623000001_expansion";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
}

function runDeploy() {
  try {
    const out = run("npx prisma migrate deploy");
    process.stdout.write(out);
  } catch (err) {
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;
    process.stderr.write(output);

    const needsRecovery =
      output.includes("P3009") ||
      output.includes("P3018") ||
      output.includes("already exists");

    if (!needsRecovery) {
      process.exit(1);
    }

    console.log("\nRecovering from failed or partially-applied migration…");
    try {
      run(`npx prisma migrate resolve --rolled-back "${FAILED_MIGRATION}"`);
      console.log(`Marked ${FAILED_MIGRATION} as rolled back.`);
    } catch (resolveErr) {
      const resolveOut = `${resolveErr.stdout ?? ""}${resolveErr.stderr ?? ""}`;
      process.stderr.write(resolveOut);
    }

    const retry = run("npx prisma migrate deploy");
    process.stdout.write(retry);
  }
}

runDeploy();
