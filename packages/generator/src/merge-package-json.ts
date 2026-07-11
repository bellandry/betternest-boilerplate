// Deep-merges a package.json fragment (db choice) into a base package.json.
// Only merges object maps (dependencies, devDependencies, scripts, ...); never
// overwrites existing keys with a whole object — merges recursively instead.

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function deepMerge(base: Json, fragment: Json): Json {
  const out: Json = { ...base };
  for (const [key, value] of Object.entries(fragment)) {
    const existing = out[key];
    if (isObject(existing) && isObject(value)) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function mergePackageJson(baseJson: string, fragmentJson: string): string {
  const base = JSON.parse(baseJson) as Json;
  const fragment = JSON.parse(fragmentJson) as Json;
  const merged = deepMerge(base, fragment);
  return JSON.stringify(merged, null, 2) + '\n';
}
