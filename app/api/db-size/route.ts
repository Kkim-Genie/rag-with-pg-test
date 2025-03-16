// app/api/db-size/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Adjust this import based on your Drizzle setup
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Execute raw SQL query using Drizzle with the sql template tag
    const result = await db.execute(sql`
      SELECT
        SUM(pg_total_relation_size(table_schema || '.' || table_name)) AS total_size_bytes
      FROM
        information_schema.tables
      WHERE
        table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_type = 'BASE TABLE'
    `);

    // Extract the total size in bytes
    const totalSizeBytes = Number(result[0]?.total_size_bytes || 0);

    // Convert to MB and GB with 2 decimal places
    const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
    const totalSizeGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);

    return NextResponse.json({ totalSizeMB, totalSizeGB });
  } catch (error) {
    console.error("Error fetching database size:", error);
    return NextResponse.json(
      { error: "Failed to fetch database size" },
      { status: 500 }
    );
  }
}
