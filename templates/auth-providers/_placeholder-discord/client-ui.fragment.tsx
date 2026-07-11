'use client';

import { Button } from '@repo/ui/button';

// Placeholder button — disabled on purpose. Proves a new provider only needs a
// folder + manifest + fragments, nothing in packages/generator.
export function DiscordButton() {
  return (
    <Button type="button" variant="outline" disabled>
      Discord — coming soon
    </Button>
  );
}
