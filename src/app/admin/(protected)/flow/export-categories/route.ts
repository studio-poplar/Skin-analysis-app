import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { assertRole } from "../../../actions";

const COLUMNS = ["categoryId", "genreId", "name", "sortOrder", "isActive", "lineUrlOverride", "lineMessageOverride"];

export async function GET() {
  await assertRole("editor");

  const categories = await prisma.concernCategory.findMany({ orderBy: [{ genreId: "asc" }, { sortOrder: "asc" }] });
  const rows = categories.map((c) => ({
    categoryId: c.categoryId,
    genreId: c.genreId,
    name: c.name,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    lineUrlOverride: c.lineUrlOverride ?? "",
    lineMessageOverride: c.lineMessageOverride ?? "",
  }));

  return new NextResponse(toCsv(rows, COLUMNS), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="categories_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
