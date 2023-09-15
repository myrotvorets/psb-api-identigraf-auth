/* c8 ignore start */
import { configure } from './lib/tracing.mjs';
import { run } from './server.mjs';

configure();
run().catch((e) => console.error(e));
/* c8 ignore end */
