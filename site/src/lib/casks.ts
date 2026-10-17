import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCask, type Cask } from './cask';

// The build runs in site/, next to the tap's Casks/ folder.
const casksDirectory = path.resolve(process.cwd(), '..', 'Casks');

/** Every cask in the tap, sorted by name. */
export async function loadCasks(): Promise<Cask[]> {
  const files = (await readdir(casksDirectory)).filter((file) => file.endsWith('.rb'));
  const casks = await Promise.all(
    files.map(async (file) => {
      const cask = parseCask(await readFile(path.join(casksDirectory, file), 'utf8'), `Casks/${file}`);
      if (`${cask.token}.rb` !== file) throw new Error(`Casks/${file}: the token is "${cask.token}"`);
      return cask;
    }),
  );
  return casks.sort((a, b) => a.name.localeCompare(b.name));
}
