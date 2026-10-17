// Reads the stanzas the site shows from a cask file. Homebrew only loads casks that sit in a tapped
// repository, so the build can't ask `brew info` about the working tree; this covers the subset of the
// cask DSL these casks use and fails the build on anything it can't resolve, rather than publishing a
// page with wrong facts.

export interface Cask {
  token: string;
  name: string;
  desc: string;
  homepage: string;
  version: string;
  sha256: string;
  url: string;
  /** Top-level `app`, `binary`, `pkg` and `suite` artifacts, in file order. */
  artifacts: Artifact[];
  minimumMacOS?: MacOSRelease;
  architecture?: 'arm64' | 'x86_64';
  /** Paths `brew uninstall --zap` removes. */
  zapPaths: string[];
}

export interface Artifact {
  kind: 'app' | 'binary' | 'pkg' | 'suite';
  name: string;
}

export interface MacOSRelease {
  version: string;
  name: string;
}

export class CaskParseError extends Error {
  constructor(file: string, message: string) {
    super(`${file}: ${message}`);
  }
}

// Homebrew's MacOSVersion::SYMBOLS for the releases a cask can still require.
const macOSReleases: Record<string, MacOSRelease> = {
  golden_gate: { version: '27', name: 'Golden Gate' },
  tahoe: { version: '26', name: 'Tahoe' },
  sequoia: { version: '15', name: 'Sequoia' },
  sonoma: { version: '14', name: 'Sonoma' },
  ventura: { version: '13', name: 'Ventura' },
  monterey: { version: '12', name: 'Monterey' },
  big_sur: { version: '11', name: 'Big Sur' },
};

const artifactKinds = new Set<Artifact['kind']>(['app', 'binary', 'pkg', 'suite']);

const blockOpener = /\bdo(\s*\|[^|]*\|)?\s*$/;
const blockCloser = /^end$/;
const stringLiteral = /"((?:[^"\\]|\\.)*)"/g;

export function parseCask(source: string, file: string): Cask {
  const lines = source.split('\n').map((line) => line.trim());
  const header = lines.map((line) => line.match(/^cask\s+"([^"]+)"\s+do$/)).find(Boolean);
  if (!header) throw new CaskParseError(file, 'no `cask "<token>" do` line');
  const token = header[1];

  // Stanzas directly inside the cask block. Nested blocks (livecheck, on_arm, caveats) are skipped.
  const stanzas: { keyword: string; text: string }[] = [];
  let depth = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line === '' || line.startsWith('#')) continue;
    if (blockCloser.test(line)) {
      depth--;
      continue;
    }
    if (depth === 1) {
      const keyword = line.match(/^([a-z_0-9]+!?)/)?.[1] ?? '';
      let text = line;
      // A stanza continues while its brackets are open, as in a multi-line `zap trash: [ ... ]`.
      while (bracketBalance(text) > 0 && index + 1 < lines.length) text += `\n${lines[++index]}`;
      stanzas.push({ keyword, text });
    }
    if (blockOpener.test(line)) depth++;
  }

  const strings = (text: string) => [...text.matchAll(stringLiteral)].map((match) => unescape(match[1]));
  const first = (keyword: string) => stanzas.find((stanza) => stanza.keyword === keyword);
  const required = (keyword: string) => {
    const value = first(keyword) && strings(first(keyword)!.text)[0];
    if (!value) throw new CaskParseError(file, `missing a \`${keyword} "…"\` stanza`);
    return value;
  };

  const version = required('version');
  const interpolate = (value: string) => {
    const result = value.replaceAll('#{version}', version);
    if (result.includes('#{')) {
      throw new CaskParseError(file, `can't resolve the interpolation in "${value}"`);
    }
    return result;
  };

  const dependsOn = stanzas.filter((stanza) => stanza.keyword === 'depends_on').map((stanza) => stanza.text);
  const macOSSymbol = dependsOn
    .map((text) => text.match(/macos:\s*(?:"\s*>=\s*)?:([a-z_]+)/)?.[1])
    .find(Boolean);
  const minimumMacOS = macOSSymbol ? macOSReleases[macOSSymbol] : undefined;
  if (macOSSymbol && !minimumMacOS) throw new CaskParseError(file, `unknown macOS release :${macOSSymbol}`);
  const architecture = dependsOn
    .map((text) => text.match(/arch:\s*:(arm64|x86_64|intel)/)?.[1])
    .map((arch) => (arch === 'intel' ? 'x86_64' : arch))
    .find(Boolean) as Cask['architecture'];

  return {
    token,
    name: required('name'),
    desc: required('desc'),
    homepage: required('homepage'),
    version,
    sha256: required('sha256'),
    url: interpolate(required('url')),
    artifacts: stanzas
      .filter((stanza) => artifactKinds.has(stanza.keyword as Artifact['kind']))
      .map((stanza) => ({ kind: stanza.keyword as Artifact['kind'], name: interpolate(strings(stanza.text)[0]) })),
    minimumMacOS,
    architecture,
    zapPaths: stanzas.filter((stanza) => stanza.keyword === 'zap').flatMap((stanza) => strings(stanza.text)),
  };
}

/** What the cask needs from the Mac, as short labels. */
export function requirementLabels(cask: Cask): string[] {
  const labels: string[] = [];
  if (cask.minimumMacOS) labels.push(`macOS ${cask.minimumMacOS.version} ${cask.minimumMacOS.name} or later`);
  if (cask.architecture) labels.push({ arm64: 'Apple silicon', x86_64: 'Intel' }[cask.architecture]);
  return labels;
}

function bracketBalance(text: string): number {
  const code = text.replace(stringLiteral, '');
  return (code.match(/\[/g)?.length ?? 0) - (code.match(/\]/g)?.length ?? 0);
}

function unescape(value: string): string {
  return value.replace(/\\(.)/g, '$1');
}
