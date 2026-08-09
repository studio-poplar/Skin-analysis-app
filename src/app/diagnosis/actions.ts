"use server";

import { submitDiagnosis, markLineRedirectClicked, type SubmitDiagnosisInput } from "@/lib/diagnosis";

export async function submitDiagnosisAction(input: SubmitDiagnosisInput) {
  if (input.selectedCategoryIds.length === 0) {
    throw new Error("悩みカテゴリが1つも選択されていません。");
  }
  if (input.lifestyleAnswers.some((a) => a.optionIds.length === 0)) {
    throw new Error("ライフスタイルに関する質問に未回答のものがあります。");
  }
  const sessionId = await submitDiagnosis(input);
  return { sessionId };
}

export async function markLineClickAction(sessionId: string) {
  await markLineRedirectClicked(sessionId);
}
