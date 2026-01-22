import { readFile } from 'node:fs/promises';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const run = async () => {
  const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  const adminKey = process.env.CONVEX_ADMIN_KEY;

  if (!convexUrl) {
    throw new Error('CONVEX_URL (or VITE_CONVEX_URL) must be set.');
  }

  const datasetsFile = await readFile(new URL('./bible-datasets.json', import.meta.url), 'utf8');
  const datasets = JSON.parse(datasetsFile);
  const client = new ConvexHttpClient(convexUrl, adminKey ? { adminKey } : undefined);

  for (const dataset of datasets) {
    const converted = await readFile(
      new URL(`../data/bibles/converted/${dataset.code}.json`, import.meta.url),
      'utf8'
    );
    const payload = JSON.parse(converted);

    console.log(`Importing ${dataset.code}...`);
    await client.action(api.bibleImport.importBibleDataset, payload);
    console.log(`Imported ${dataset.code}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
