export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface OutgoingEmail extends EmailPayload {
  from: string;
}

// A driver is the only thing that touches a concrete provider SDK. Add a new
// provider = add a file under drivers/ that returns one of these, then wire it
// in index.ts. Nothing else in the monorepo changes.
export interface EmailDriver {
  send(email: OutgoingEmail): Promise<void>;
}
