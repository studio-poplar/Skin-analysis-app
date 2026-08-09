import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardCharts, type DashboardData } from "./DashboardCharts";

export const dynamic = "force-dynamic";

type StoredAnswers = {
  ageOptionId?: number;
  genderOptionId?: number;
  lifestyleAnswers?: { questionId: number; optionIds: number[] }[];
  skincareBrandFreeText?: string;
  supplementBrandFreeText?: string;
};

export default async function AdminDashboardPage() {
  const [productCount, unverifiedKnowledgeCount, genres, basicQuestions, lifestyleQuestions, sessions] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.generalKnowledge.count({ where: { isSourceVerified: false } }),
      prisma.genre.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      }),
      prisma.question.findMany({
        where: { step: 1 },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      }),
      prisma.question.findMany({
        where: { step: 2 },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      }),
      prisma.diagnosisSession.findMany({
        include: { results: true },
        orderBy: { startedAt: "asc" },
      }),
    ]);

  // 表示順(sortOrder)ではなく、質問のrole(節7-15参照)で「年代」「性別」を識別する。
  // v8で管理画面から質問の表示順を自由に並び替えられるようになったため、位置での識別はしない。
  const ageQuestion = basicQuestions.find((q) => q.role === "age") ?? basicQuestions[0];
  const genderQ = basicQuestions.find((q) => q.role === "gender") ?? basicQuestions[1];

  const ageLabelsOrdered = (ageQuestion?.options ?? []).map((o) => o.optionText);
  const genderLabelsOrdered = (genderQ?.options ?? []).map((o) => o.optionText);

  // ライフスタイル設問(節7-14・7-15): roleで①スキンケア習慣・④サプリメント摂取を識別する
  const skincareRoutineQuestion = lifestyleQuestions.find((q) => q.role === "skincare_routine");
  const supplementUsageQuestion = lifestyleQuestions.find((q) => q.role === "supplement_usage");
  const skincareOptionLabel = new Map((skincareRoutineQuestion?.options ?? []).map((o) => [o.optionId, o.optionText]));
  const supplementOptionLabel = new Map((supplementUsageQuestion?.options ?? []).map((o) => [o.optionId, o.optionText]));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const allSessions = sessions;
  const thisMonthSessions = allSessions.filter((s) => s.startedAt >= monthStart);

  const totals = {
    allTime: {
      sessions: allSessions.length,
      lineClicks: allSessions.filter((s) => s.lineRedirectClicked).length,
    },
    thisMonth: {
      sessions: thisMonthSessions.length,
      lineClicks: thisMonthSessions.filter((s) => s.lineRedirectClicked).length,
    },
  };

  // カテゴリ一覧(ジャンル→並び順、ドロップダウン・②のラベル用)
  const categoryOptions: { categoryId: string; name: string; genreName: string }[] = [];
  for (const genre of genres) {
    for (const category of genre.categories) {
      categoryOptions.push({ categoryId: category.categoryId, name: category.name, genreName: genre.name });
    }
  }
  const categoryNameById = new Map(categoryOptions.map((c) => [c.categoryId, c.name]));

  // ②悩みカテゴリ別の件数、③年代×性別、⑤ケア習慣クロス集計を、DiagnosisResult単位で一括集計する
  const categoryCountMap = new Map<string, number>();
  const ageGenderByCategory: DashboardData["ageGenderByCategory"] = {};
  const careByCategory: DashboardData["careByCategory"] = {};

  for (const c of categoryOptions) {
    ageGenderByCategory[c.categoryId] = {
      ageLabels: ageLabelsOrdered,
      genderLabels: genderLabelsOrdered,
      counts: ageLabelsOrdered.map(() => genderLabelsOrdered.map(() => 0)),
    };
    careByCategory[c.categoryId] = {
      skincare: Array.from(skincareOptionLabel.values()).map((label) => ({ label, count: 0 })),
      supplement: Array.from(supplementOptionLabel.values()).map((label) => ({ label, count: 0 })),
    };
  }

  const skincareFreeTexts: string[] = [];
  const supplementFreeTexts: string[] = [];
  const seenSessionIdsForFreeText = new Set<string>();

  for (const session of allSessions) {
    const answers = session.answersJson as StoredAnswers;

    if (!seenSessionIdsForFreeText.has(session.sessionId)) {
      seenSessionIdsForFreeText.add(session.sessionId);
      const skincareText = answers.skincareBrandFreeText?.trim();
      const supplementText = answers.supplementBrandFreeText?.trim();
      if (skincareText) skincareFreeTexts.push(skincareText);
      if (supplementText) supplementFreeTexts.push(supplementText);
    }

    const ageIndex = ageQuestion?.options.findIndex((o) => o.optionId === answers.ageOptionId) ?? -1;
    const genderIndex = genderQ?.options.findIndex((o) => o.optionId === answers.genderOptionId) ?? -1;

    const skincareAnswer = answers.lifestyleAnswers?.find((a) => a.questionId === skincareRoutineQuestion?.questionId);
    const supplementAnswer = answers.lifestyleAnswers?.find((a) => a.questionId === supplementUsageQuestion?.questionId);
    const skincareLabel = skincareAnswer?.optionIds[0] != null ? skincareOptionLabel.get(skincareAnswer.optionIds[0]) : undefined;
    const supplementLabel =
      supplementAnswer?.optionIds[0] != null ? supplementOptionLabel.get(supplementAnswer.optionIds[0]) : undefined;

    for (const result of session.results) {
      categoryCountMap.set(result.categoryId, (categoryCountMap.get(result.categoryId) ?? 0) + 1);

      const table = ageGenderByCategory[result.categoryId];
      if (table && ageIndex >= 0 && genderIndex >= 0) {
        table.counts[ageIndex][genderIndex] += 1;
      }

      const care = careByCategory[result.categoryId];
      if (care) {
        if (skincareLabel) {
          const row = care.skincare.find((r) => r.label === skincareLabel);
          if (row) row.count += 1;
        }
        if (supplementLabel) {
          const row = care.supplement.find((r) => r.label === supplementLabel);
          if (row) row.count += 1;
        }
      }
    }
  }

  const categoryCounts: DashboardData["categoryCounts"] = categoryOptions.map((c) => ({
    categoryId: c.categoryId,
    name: c.name,
    count: categoryCountMap.get(c.categoryId) ?? 0,
  }));

  // ④月次の診断完了数推移(startedAtを年月でバケット化)
  const monthlyMap = new Map<string, number>();
  for (const session of allSessions) {
    const key = `${session.startedAt.getFullYear()}/${String(session.startedAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
  }
  const monthlyTrend: DashboardData["monthlyTrend"] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, count]) => ({ month, count }));

  const dashboardData: DashboardData = {
    totals,
    categoryCounts,
    monthlyTrend,
    categoryOptions: categoryOptions.map((c) => ({ categoryId: c.categoryId, name: c.name })),
    ageGenderByCategory,
    careByCategory,
    freeTexts: { skincare: skincareFreeTexts, supplement: supplementFreeTexts },
  };

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900">ダッシュボード</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
          <p className="mb-1 text-xs text-zinc-500">取扱中の製品</p>
          <p className="text-2xl font-bold text-zinc-900">{productCount}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
          <p className="mb-1 text-xs text-zinc-500">出典未確認の一般知識</p>
          <p className={`text-2xl font-bold ${unverifiedKnowledgeCount > 0 ? "text-amber-600" : "text-zinc-900"}`}>
            {unverifiedKnowledgeCount}
          </p>
        </div>
      </div>

      {unverifiedKnowledgeCount > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          「一般知識」セクションに出典未確認の項目が{unverifiedKnowledgeCount}件あります。公開前に薬機法の観点で表現・出典を確認してください。
          <Link href="/admin/knowledge" className="ml-2 font-semibold underline">
            確認する
          </Link>
        </div>
      )}

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/admin/products" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:ring-rose-200">
          <p className="mb-1 font-semibold text-zinc-900">製品管理</p>
          <p className="text-sm text-zinc-500">価格・取扱状況・臨床データ要約を編集します。</p>
        </Link>
        <Link href="/admin/knowledge" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:ring-rose-200">
          <p className="mb-1 font-semibold text-zinc-900">一般知識管理</p>
          <p className="text-sm text-zinc-500">カテゴリ別の一般知識テキストと出典確認フラグを編集します。</p>
        </Link>
        <Link href="/admin/mapping" className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:ring-rose-200">
          <p className="mb-1 font-semibold text-zinc-900">提案マッピング</p>
          <p className="text-sm text-zinc-500">カテゴリ・回答ごとにおすすめする製品を調整します。</p>
        </Link>
      </div>

      <DashboardCharts data={dashboardData} />
    </div>
  );
}
