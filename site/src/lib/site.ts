export const tap = {
  name: 'shisheng233/tap',
  author: 'ShiSheng',
  repository: 'https://github.com/ShiSheng233/homebrew-tap',
};

export function caskSourceURL(token: string): string {
  return `${tap.repository}/blob/main/Casks/${token}.rb`;
}
