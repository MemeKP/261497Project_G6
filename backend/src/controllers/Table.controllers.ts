import { dbClient } from "@db/client.js";
import { diningSessions, tables } from "@db/schema.js";
import { asc, eq } from "drizzle-orm";
import { type Request, type Response, type NextFunction } from "express";

// backend - สร้าง endpoint ใหม่
export const getTablesWithSessionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const allTables = await dbClient.query.tables.findMany({
            orderBy: [asc(tables.number)]
        });

        const activeSessions = await dbClient.query.diningSessions.findMany({
            where: eq(diningSessions.status, "ACTIVE"),
        });

        const tablesWithStatus = allTables.map(table => ({
            id: table.id,
            number: table.number,
            status: activeSessions.some(session => session.tableId === table.id)
                ? "OCCUPIED"
                : "FREE",
        }));

        res.json({ tables: tablesWithStatus });
    } catch (error) {
        console.error("Error fetching tables with status:", error);
        next()
    }
};