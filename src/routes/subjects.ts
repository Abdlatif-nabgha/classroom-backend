import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { departements, subjects } from "../db/schema";
import { db } from "../db";

const router = express.Router();

// Get all subjects with optional search, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, departement, page = 1, limit = 10} = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // if search query exists, filter by subject name or subject code 
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            );
        }
        
        // If departement filter exists, match departement name
        if (departement) {
            const deptPattern = `%${String(departement).replace(/[%_]/g, '\\$&')}%`;
            filterConditions.push(ilike(departements.name, deptPattern));
        }

        // combine all filter using AND if any exists
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
                        .select({ count: sql<number>`count(*)::int` })
                        .from(subjects)
                        .leftJoin(departements, eq(subjects.departementId, departements.id))
                        .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const subjectsList = await db
                        .select({
                            ...getTableColumns(subjects),
                            departement: {...getTableColumns(departements)}
                        })
                        .from(subjects)
                        .leftJoin(departements, eq(subjects.departementId, departements.id))
                        .where(whereClause)
                        .orderBy(desc(subjects.createdAt))
                        .limit(limitPerPage)
                        .offset(offset);

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });
    } catch (error) {
        console.error(`GET /subjects error: ${error}`);
        res.status(500).json({ error: "Failed to get subjects" });
    }
});

export default router;