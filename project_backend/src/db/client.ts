import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "src/db/schema.js";
import { connectionString } from "src/db/utils.js";
import { Pool } from "pg";

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema, logger: true });
