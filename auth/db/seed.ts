import { dbClient, dbConn } from "@db/client.js";
import { usersTable } from "@db/schema.js";
import bcrypt from "bcrypt";

const saltRounds = 10;
const password = "261497g06";

async function insertData() {
  bcrypt.hash(password, saltRounds, async function (err, hash) {
    const results = await dbClient
      .insert(usersTable)
      .values([
        {
          name: "Admin",
          email: "admin@mail.com",
          isAdmin: true,
          password: hash,
        },
        {
          name: "User",
          email: "user@mail.com",
          isAdmin: false,
          password: hash,
        },
      ])
      .returning({ id: usersTable.id });

    dbConn.close();
  });
}

insertData();
