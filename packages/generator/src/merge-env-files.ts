import { injectMarkers } from './inject-markers';

// Composes the api .env.example from the base skeleton + the db env fragment +
// each selected provider's env fragment, injected at named markers so the
// output stays grouped and readable (section comments live inside fragments).
export function mergeEnvFile(
  baseSkeleton: string,
  dbEnvFragment: string,
  providerEnvFragments: string[],
): string {
  return injectMarkers(baseSkeleton, {
    DATABASE_ENV: dbEnvFragment.trim(),
    AUTH_PROVIDER_ENV: providerEnvFragments
      .map((f) => f.trim())
      .filter(Boolean)
      .join('\n\n'),
  });
}
