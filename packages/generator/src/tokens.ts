// Dumb token replacement (no templating engine, no logic/helpers by design).
// Replaces every {{TOKEN}} occurrence. Used on .hbs base files.
export function replaceTokens(content: string, tokens: Record<string, string>): string {
  return content.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (whole, key: string) => {
    return key in tokens ? tokens[key] : whole;
  });
}

// Derive a safe token set from the selection.
export function buildTokens(projectName: string): Record<string, string> {
  const dbName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return {
    PROJECT_NAME: projectName,
    DB_NAME: dbName || 'app',
  };
}
