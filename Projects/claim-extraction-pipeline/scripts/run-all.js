import { execFileSync } from "node:child_process";

for (let i = 1; i <= 10; i++) {
  console.log(`\n${"#".repeat(60)}\n# running step ${i}\n${"#".repeat(60)}`);
  execFileSync("npm", ["run", `step${i}`], { stdio: "inherit" });
}
