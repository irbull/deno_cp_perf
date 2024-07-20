import { join } from "jsr:@std/path/join";

safeDelete("./temp");
safeDelete("./tempShellCopy");
safeDelete("./tempAsyncCopy");
safeDelete("./tempSyncCopy");

// Create Files
Deno.mkdirSync("./temp", { recursive: true });
createTempFiles("./temp", 10_000);
console.log("Files created");

// Copy Files in different ways and measure time
const start = performance.now();
await cpShell("temp", "./tempShellCopy");
const shellPerf = performance.now();
await cpAsync("./temp", "./tempAsyncCopy");
const asyncPerf = performance.now();
await cpSync("./temp", "./tempSyncCopy");
const syncPerf = performance.now();

console.log(`Shell: ${shellPerf - start}ms`);
console.log(`Async: ${asyncPerf - shellPerf}ms`);
console.log(`Sync: ${syncPerf - asyncPerf}ms`);

function safeDelete(path: string): void {
  try {
    Deno.removeSync(path, { recursive: true });
  } catch {
    // ignore if it doesn't exist
  }
}

async function cpShell(src: string, dest: string) {
  const cwd = Deno.cwd();
  Deno.mkdirSync(dest, { recursive: true });
  const command = new Deno.Command("sh", {
    args: [
      "-c",
      `/bin/cp ${cwd}/${src}/* ${cwd}/${dest}/.`,
    ],
    stdin: "piped",
    stdout: "piped",
  });
  const child = command.spawn();
  child.stdin.close();
  await child.status;
}

async function cpAsync(src: string, dest: string) {
  Deno.mkdirSync(dest, { recursive: true });
  const results = [];
  for await (const dirEntry of Deno.readDir(src)) {
    results.push(
      Deno.copyFile(join(src, dirEntry.name), join(dest, dirEntry.name)),
    );
  }
  await Promise.all(results);
}

async function cpSync(src: string, dest: string) {
  Deno.mkdirSync(dest, { recursive: true });
  for await (const dirEntry of Deno.readDir(src)) {
    Deno.copyFileSync(join(src, dirEntry.name), join(dest, dirEntry.name));
  }
}

function createTempFiles(path: string, count: number): void {
  for (let i = 0; i < count; i++) {
    const randomText = Math.random().toString(36).substring(2);
    Deno.writeTextFileSync(join(path, `${randomText}.txt`), randomText);
  }
}
