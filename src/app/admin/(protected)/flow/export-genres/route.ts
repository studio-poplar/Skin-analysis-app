import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { assertRole } from "../../../actions";

const COLUMNS = ["genreId", "name", "sortOrder", "isActive"];

export async function GET() {
  await assertRole("editor");

  const genres = await prisma.genre.findMany({ orderBy: { sortOrder: "asc" } });
  const rows = genres.map((g) => ({
    genreId: g.genreId,
    name: g.name,
    sortOrder: g.sortOrder,
    isActive: g.isActive,
  }));

  return new NextResponse(toCsv(rows, COLUMNS), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="genres_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
