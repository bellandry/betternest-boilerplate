// Marker injection — the ONE place markers are replaced. Reused for every
// file that composes fragments (auth server config, auth pages, env, README).
//
// A marker is a whole line whose trimmed text equals one of the known marker
// comment forms. We replace that entire line with the given content. If content
// is empty, the marker line is removed. Indentation is irrelevant because the
// generated output is run through Prettier afterwards.

export type MarkerMap = Record<string, string>;

// Matches the marker token inside common comment shells:
//   // MARKER
//   {/* MARKER */}
//   # MARKER
//   <!-- MARKER -->
function lineMarker(line: string): string | null {
  const t = line.trim();
  const patterns = [
    /^\/\/\s*([A-Z0-9_]+)\s*$/, // // MARKER
    /^\{\/\*\s*([A-Z0-9_]+)\s*\*\/\}$/, // {/* MARKER */}
    /^#\s*([A-Z0-9_]+)\s*$/, // # MARKER
    /^<!--\s*([A-Z0-9_]+)\s*-->$/, // <!-- MARKER -->
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1];
  }
  return null;
}

export function injectMarkers(content: string, markers: MarkerMap): string {
  const lines = content.split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const marker = lineMarker(line);
    if (marker && marker in markers) {
      const replacement = markers[marker];
      if (replacement.trim().length === 0) {
        continue; // drop the marker line entirely
      }
      out.push(replacement);
    } else {
      out.push(line);
    }
  }

  return out.join('\n');
}
