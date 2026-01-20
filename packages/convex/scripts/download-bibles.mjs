import { mkdir, readFile, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename } from 'node:path';
import { pipeline } from 'node:stream/promises';

const readDatasets = async () => {
  const file = await readFile(new URL('./bible-datasets.json', import.meta.url), 'utf8');
  return JSON.parse(file);
};

const run = async () => {
  const list = await readDatasets();
  const outputDir = new URL('../data/bibles/raw/', import.meta.url);
  await mkdir(outputDir, { recursive: true });

  for (const item of list) {
    const target = new URL(`${item.code}.json`, outputDir);
    try {
      await stat(target);
      console.log(`Skipping ${item.code} (already downloaded)`);
      continue;
    } catch {
      // continue
    }

    console.log(`Downloading ${item.code} from ${item.sourceUrl}`);
    const response = await fetch(item.sourceUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download ${item.code}: ${response.status} ${response.statusText}`);
    }

    await pipeline(response.body, createWriteStream(target));
    console.log(`Saved ${basename(target.pathname)}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
