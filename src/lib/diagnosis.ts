import { prisma } from "@/lib/prisma";

export type LifestyleQuestion = {
  questionId: number;
  questionText: string;
  questionType: "single_select" | "multi_select";
  role: string | null;
  options: { optionId: number; text: string }[];
};

export type DiagnosisFormData = {
  // ②基本情報(年代・性別)。管理画面のドラッグ&ドロップ並び替え(v8)が実際の表示順にも
  // 反映されるよう、固定の2フィールドではなく表示順(sortOrder)配列として持つ。
  // どちらが年代/性別かは`role`("age"|"gender")で識別する(節7-15参照)。
  basicQuestions: LifestyleQuestion[];
  // ③ライフスタイル設問(6問、節7-14)。同様にsortOrder順、意味の識別はroleで行う。
  lifestyleQuestions: LifestyleQuestion[];
  genres: {
    genreId: string;
    name: string;
    categories: { categoryId: string; name: string }[];
  }[];
};

// 診断フォームの初期表示に必要な質問・ジャンル・症状カテゴリ一式を取得する
export async function getDiagnosisFormData(): Promise<DiagnosisFormData> {
  const [basicQuestions, lifestyleQuestions, genres] = await Promise.all([
    // 表示順は管理画面でドラッグ&ドロップ並び替え可能な sortOrder に従う(v8)。
    // 「年代」「性別」どちらかの識別はroleで行う(questionTextや並び順には依存しない)。
    prisma.question.findMany({
      where: { step: 1 },
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    }),
    // ライフスタイル設問(step:2)も同様にsortOrderで表示順、roleで意味を識別する
    prisma.question.findMany({
      where: { step: 2 },
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.genre.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { categories: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const hasAge = basicQuestions.some((q) => q.role === "age");
  const hasGender = basicQuestions.some((q) => q.role === "gender");

  if (!hasAge || !hasGender) {
    throw new Error("質問マスタが投入されていません。`npm run db:seed` を実行してください。");
  }

  return {
    basicQuestions: basicQuestions.map((q) => ({
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: q.questionType,
      role: q.role,
      options: q.options.map((o) => ({ optionId: o.optionId, text: o.optionText })),
    })),
    lifestyleQuestions: lifestyleQuestions.map((q) => ({
      questionId: q.questionId,
      questionText: q.questionText,
      questionType: q.questionType,
      role: q.role,
      options: q.options.map((o) => ({ optionId: o.optionId, text: o.optionText })),
    })),
    genres: genres.map((g) => ({
      genreId: g.genreId,
      name: g.name,
      categories: g.categories.map((c) => ({ categoryId: c.categoryId, name: c.name })),
    })),
  };
}

export type SubmitDiagnosisInput = {
  ageOptionId: number | null;
  genderOptionId: number | null;
  // ライフスタイル設問(step:2、6問)への回答。単一選択もoptionIds配列(長さ1)で統一して扱う。
  lifestyleAnswers: { questionId: number; optionIds: number[] }[];
  // 自由記述(未回答可)。個人情報を書かないよう入力欄側でプレースホルダー注記している(節7-14参照)。
  skincareBrandFreeText: string;
  supplementBrandFreeText: string;
  selectedGenreIds: string[];
  selectedCategoryIds: string[]; // 選択されたジャンルの中から選んだ症状カテゴリ(フラット)
};

// おすすめのお手入れステップの並び順(管理画面のCareStepOrderで編集可能。該当しない製品カテゴリは末尾に押し出す)
function careStepRank(productCategory: string, order: { keyword: string }[]): number {
  const index = order.findIndex((o) => productCategory.includes(o.keyword));
  return index === -1 ? order.length : index;
}

// 回答内容から診断セッション・診断結果を作成する
export async function submitDiagnosis(input: SubmitDiagnosisInput): Promise<string> {
  const categories = await prisma.concernCategory.findMany({
    where: { categoryId: { in: input.selectedCategoryIds } },
    orderBy: { sortOrder: "asc" },
  });

  const session = await prisma.diagnosisSession.create({
    data: {
      answersJson: JSON.parse(JSON.stringify(input)),
    },
  });

  for (const category of categories) {
    // isActive:falseの製品(取扱注意・一時販売停止中等)は新規の診断結果には出さない
    const mapped = await prisma.productConcernMap.findMany({
      where: { categoryId: category.categoryId, product: { isActive: true } },
      orderBy: { priority: "asc" },
    });

    await prisma.diagnosisResult.create({
      data: {
        sessionId: session.sessionId,
        categoryId: category.categoryId,
        recommendedProductIds: mapped.map((m) => m.productId),
      },
    });
  }

  return session.sessionId;
}

export type DiagnosisResultView = {
  sessionId: string;
  genreGroups: {
    genreId: string;
    genreName: string;
    categoryBlocks: {
      categoryId: string;
      name: string;
      whyText: string; // 原因の説明(Why)
      howText: string; // 改善方法・セルフケア(How)
      products: {
        productId: number;
        nameJp: string;
        category: string;
        priceJpy: number;
        productUrl: string;
        hasAntiWrinkleTest: boolean;
        summaryText: string;
        clinicalSourceUrl: string | null;
      }[];
    }[];
  }[];
  careSteps: {
    productId: number;
    nameJp: string;
    category: string;
    productUrl: string;
  }[];
  // 結果に含まれるカテゴリの中で最も優先度の高い(ジャンル・カテゴリ順で先頭の)個別LINE設定。
  // なければnull(その場合は共通のLineSettingsを使う)
  lineOverride: { url: string; message: string | null } | null;
};

// 結果URL(トークン)の有効期間。運営者の方針により3ヶ月とした(2026-08-08)。
// 期限を過ぎたセッションは「見つからない」扱いにして結果ページへのアクセスを止める。
// ただし匿名集計・分析目的のデータとしてはDB上に残す(節7-9参照。プライバシーポリシーの
// 「利用目的」で説明している匿名集計はこのデータを引き続き使う想定のため、物理削除はしない)。
const RESULT_LINK_EXPIRY_DAYS = 90;

function isSessionExpired(startedAt: Date): boolean {
  const expiryMs = RESULT_LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - startedAt.getTime() > expiryMs;
}

// 結果ページ表示前の軽い状態チェック(「見つからない」と「期限切れ」を画面上で区別するために使う)
export async function checkResultSessionStatus(sessionId: string): Promise<"ok" | "expired" | "not_found"> {
  const session = await prisma.diagnosisSession.findUnique({
    where: { sessionId },
    select: { startedAt: true },
  });
  if (!session) return "not_found";
  if (isSessionExpired(session.startedAt)) return "expired";
  return "ok";
}

// 診断結果画面の表示に必要なデータを組み立てる
// preview=trueは管理者のプレビューモード時のみ(公開結果ページは常にpublished値のみを見る)、
// カテゴリ名・Why/Howの下書き(draft*)があればそちらを優先して表示する
export async function getDiagnosisResult(
  sessionId: string,
  preview = false
): Promise<DiagnosisResultView | null> {
  const session = await prisma.diagnosisSession.findUnique({
    where: { sessionId },
    include: {
      results: {
        include: { category: { include: { genre: true } } },
      },
    },
  });
  if (!session) return null;
  // プレビューモード(管理者の動作確認)は期限切れでも見られるようにする
  if (!preview && isSessionExpired(session.startedAt)) return null;

  const allProductIds = Array.from(
    new Set(session.results.flatMap((r) => (r.recommendedProductIds as number[]) ?? []))
  );

  const products = await prisma.product.findMany({
    where: { productId: { in: allProductIds } },
    include: { clinicalData: true },
  });
  const productById = new Map(products.map((p) => [p.productId, p]));

  const knowledgeRows = await prisma.generalKnowledge.findMany({
    where: { categoryId: { in: session.results.map((r) => r.categoryId) } },
  });
  const knowledgeByCategory = new Map(
    knowledgeRows.map((k) => [
      k.categoryId,
      {
        why: (preview ? k.draftContentText : null) ?? k.contentText,
        how: (preview ? k.draftSelfCareText : null) ?? k.selfCareText ?? "",
      },
    ])
  );

  const sortedResults = [...session.results].sort((a, b) => {
    const genreDiff = a.category.genre.sortOrder - b.category.genre.sortOrder;
    if (genreDiff !== 0) return genreDiff;
    return a.category.sortOrder - b.category.sortOrder;
  });

  const categoryWithOverride = sortedResults.find((r) => r.category.lineUrlOverride);
  const lineOverride = categoryWithOverride
    ? { url: categoryWithOverride.category.lineUrlOverride!, message: categoryWithOverride.category.lineMessageOverride }
    : null;

  const genreGroups: DiagnosisResultView["genreGroups"] = [];
  // 化粧水やマルチビタミン等、複数カテゴリに共通で紐付く製品が結果画面で重複表示されないよう、
  // ジャンル→カテゴリの並び順で最初に登場したカテゴリの「それを補完するアイテム」にのみ表示する
  // (お手入れステップは元々製品ID単位でユニーク化されているため対象外)。
  // 併せて、どのカテゴリがその製品を先取りしたかを記録しておく(カテゴリ別お手入れステップ順の解決に使う。節7-9・v5指示書2-1参照)。
  const claimedProductIds = new Set<number>();
  const productClaimedByCategory = new Map<number, string>();
  for (const r of sortedResults) {
    const productIds = ((r.recommendedProductIds as number[]) ?? []).filter((id) => {
      if (claimedProductIds.has(id)) return false;
      claimedProductIds.add(id);
      productClaimedByCategory.set(id, r.categoryId);
      return true;
    });
    const knowledge = knowledgeByCategory.get(r.categoryId);
    const block = {
      categoryId: r.categoryId,
      name: (preview ? r.category.draftName : null) ?? r.category.name,
      whyText: knowledge?.why ?? "",
      howText: knowledge?.how ?? "",
      products: productIds
        .map((id) => productById.get(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => ({
          productId: p.productId,
          nameJp: p.nameJp,
          category: p.category,
          priceJpy: p.priceJpy,
          productUrl: p.productUrl,
          hasAntiWrinkleTest: p.clinicalData?.hasAntiWrinkleTest ?? false,
          summaryText: p.clinicalData?.summaryText ?? "",
          clinicalSourceUrl: p.clinicalData?.sourceUrl ?? null,
        })),
    };

    let group = genreGroups.find((g) => g.genreId === r.category.genre.genreId);
    if (!group) {
      group = {
        genreId: r.category.genre.genreId,
        genreName: (preview ? r.category.genre.draftName : null) ?? r.category.genre.name,
        categoryBlocks: [],
      };
      genreGroups.push(group);
    }
    group.categoryBlocks.push(block);
  }

  // 「お手入れステップ」はスキンケアの塗布順の概念であり、サプリメント等(同時摂取に注意が
  // 必要な組み合わせもある)を並べて「順番に使う」ものとして誤解させないよう、
  // スキンケア該当製品(CareStepOrderに一致するもの、管理画面で編集可能)のみを対象にする。
  // 2026-08-09追加: カテゴリごとに専用の並び順を設定できるようにした(v5指示書2-1)。
  // 複数カテゴリにまたがる製品は、節7-9の重複排除で「先取りした」カテゴリの設定を採用する。
  const allCareStepOrders = await prisma.careStepOrder.findMany({ orderBy: { sortOrder: "asc" } });
  const defaultCareStepOrder = allCareStepOrders.filter((s) => !s.categoryId);
  const careStepOrderByCategory = new Map<string, typeof allCareStepOrders>();
  for (const step of allCareStepOrders) {
    if (!step.categoryId) continue;
    if (!careStepOrderByCategory.has(step.categoryId)) careStepOrderByCategory.set(step.categoryId, []);
    careStepOrderByCategory.get(step.categoryId)!.push(step);
  }
  function orderForProduct(productId: number) {
    const categoryId = productClaimedByCategory.get(productId);
    if (categoryId) {
      const categoryOrder = careStepOrderByCategory.get(categoryId);
      if (categoryOrder && categoryOrder.length > 0) return categoryOrder;
    }
    return defaultCareStepOrder;
  }

  const careSteps = products
    .filter((p) => careStepRank(p.category, orderForProduct(p.productId)) < orderForProduct(p.productId).length)
    .sort((a, b) => careStepRank(a.category, orderForProduct(a.productId)) - careStepRank(b.category, orderForProduct(b.productId)))
    .map((p) => ({
      productId: p.productId,
      nameJp: p.nameJp,
      category: p.category,
      productUrl: p.productUrl,
    }));

  return { sessionId, genreGroups, careSteps, lineOverride };
}

export async function markLineRedirectClicked(sessionId: string) {
  await prisma.diagnosisSession.update({
    where: { sessionId },
    data: { lineRedirectClicked: true },
  });
}
