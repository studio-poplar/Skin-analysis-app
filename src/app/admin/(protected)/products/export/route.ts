import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { assertRole } from "../../../actions";

const COLUMNS = [
  "productCode",
  "nameJp",
  "nameUsRef",
  "category",
  "priceJpy",
  "productUrl",
  "isActive",
  "summaryText",
  "hasAntiWrinkleTest",
  "sourceUrl",
];

export async function GET() {
  await assertRole("editor");

  const products = await prisma.product.findMany({
    include: { clinicalData: true },
    orderBy: { productId: "asc" },
  });

  const rows = products.map((p) => ({
    productCode: p.productCode,
    nameJp: p.nameJp,
    nameUsRef: p.nameUsRef ?? "",
    category: p.category,
    priceJpy: p.priceJpy,
    productUrl: p.productUrl,
    isActive: p.isActive,
    summaryText: p.clinicalData?.summaryText ?? "",
    hasAntiWrinkleTest: p.clinicalData?.hasAntiWrinkleTest ?? false,
    sourceUrl: p.clinicalData?.sourceUrl ?? "",
  }));

  const csv = toCsv(rows, COLUMNS);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
