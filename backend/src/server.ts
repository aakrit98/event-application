import app from "./app";
import { env } from "./config/env";
import { ensureDefaultTags } from "./services/tag.service";

// Seed the fixed event tags on every startup (idempotent: missing names
// are inserted, existing ones are left alone). This guarantees the tag
// dropdown works on any machine, even one whose database predates the
// tag-seed migration or was copied without it.
ensureDefaultTags().catch((err) => {
  console.warn("Tag seeding failed at startup:", (err as Error).message);
});

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});