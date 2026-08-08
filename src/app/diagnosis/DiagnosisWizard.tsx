"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosisFormData } from "@/lib/diagnosis";
import { submitDiagnosisAction } from "./actions";

function ProgressBar({ stepLabel, percent }: { stepLabel: string; percent: number }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-medium text-zinc-500">{stepLabel}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-rose-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
        selected
          ? "border-rose-500 bg-rose-50 text-rose-700"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-rose-200"
      }`}
    >
      {label}
    </button>
  );
}

function NextButton({ disabled, onClick, label = "次へ" }: { disabled: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-8 w-full rounded-[var(--brand-button-radius)] bg-[var(--brand-primary)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors enabled:hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      {label}
    </button>
  );
}

type Step = { kind: "basic" } | { kind: "genre" } | { kind: "symptom"; index: number } | { kind: "submitting" };

export function DiagnosisWizard({ data, copy }: { data: DiagnosisFormData; copy: Record<string, string> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>({ kind: "basic" });
  const [ageOptionId, setAgeOptionId] = useState<number | null>(null);
  const [genderOptionId, setGenderOptionId] = useState<number | null>(null);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const orderedSelectedGenres = useMemo(
    () => data.genres.filter((g) => selectedGenreIds.includes(g.genreId)),
    [data.genres, selectedGenreIds]
  );

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  }

  function goToSymptomOrSubmit(nextIndex: number) {
    if (nextIndex < orderedSelectedGenres.length) {
      setStep({ kind: "symptom", index: nextIndex });
    } else {
      submit();
    }
  }

  function submit() {
    setStep({ kind: "submitting" });
    setError(null);
    startTransition(async () => {
      try {
        const { sessionId } = await submitDiagnosisAction({
          ageOptionId,
          genderOptionId,
          selectedGenreIds,
          selectedCategoryIds,
        });
        router.push(`/diagnosis/result/${sessionId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "診断結果の作成に失敗しました。");
        setStep({ kind: "symptom", index: orderedSelectedGenres.length - 1 });
      }
    });
  }

  if (step.kind === "basic") {
    return (
      <div>
        <ProgressBar stepLabel={copy["diagnosis.step1_label"] ?? "Step 1/3・基本情報"} percent={10} />
        <h2 className="mb-6 text-lg font-bold text-zinc-900">
          {copy["diagnosis.step1_heading"] ?? "まずは基本的なことを教えてください"}
        </h2>

        <p className="mb-2 text-sm font-semibold text-zinc-700">{copy["diagnosis.age_label"] ?? "年代"}</p>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {data.ageQuestion.options.map((o) => (
            <OptionButton
              key={o.optionId}
              label={o.text}
              selected={ageOptionId === o.optionId}
              onClick={() => setAgeOptionId(o.optionId)}
            />
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-zinc-700">{copy["diagnosis.gender_label"] ?? "性別"}</p>
        <div className="grid grid-cols-3 gap-2">
          {data.genderQuestion.options.map((o) => (
            <OptionButton
              key={o.optionId}
              label={o.text}
              selected={genderOptionId === o.optionId}
              onClick={() => setGenderOptionId(o.optionId)}
            />
          ))}
        </div>

        <NextButton
          disabled={!ageOptionId || !genderOptionId}
          label={copy["diagnosis.next_button"] ?? "次へ"}
          onClick={() => setStep({ kind: "genre" })}
        />
      </div>
    );
  }

  if (step.kind === "genre") {
    return (
      <div>
        <ProgressBar stepLabel={copy["diagnosis.step2_label"] ?? "Step 2/3・気になること"} percent={40} />
        <h2 className="mb-1 text-lg font-bold text-zinc-900">
          {copy["diagnosis.step2_heading"] ?? "今、気になることはどれですか?"}
        </h2>
        <p className="mb-6 text-xs text-zinc-500">{copy["diagnosis.multi_select_hint"] ?? "いくつでも選択できます"}</p>

        <div className="grid grid-cols-1 gap-2">
          {data.genres.map((g) => (
            <OptionButton
              key={g.genreId}
              label={g.name}
              selected={selectedGenreIds.includes(g.genreId)}
              onClick={() => toggleGenre(g.genreId)}
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <NextButton
          disabled={selectedGenreIds.length === 0}
          label={copy["diagnosis.next_button"] ?? "次へ"}
          onClick={() => goToSymptomOrSubmit(0)}
        />
      </div>
    );
  }

  if (step.kind === "symptom") {
    const genre = orderedSelectedGenres[step.index];
    const isLast = step.index === orderedSelectedGenres.length - 1;
    const selectedInThisGenre = genre.categories.filter((c) => selectedCategoryIds.includes(c.categoryId));
    const symptomHeading = (copy["diagnosis.symptom_heading_template"] ?? "「{genre}」について、気になる症状は?").replace(
      "{genre}",
      genre.name
    );

    return (
      <div>
        <ProgressBar
          stepLabel={`Step 3/3・${step.index + 1}/${orderedSelectedGenres.length}分野中`}
          percent={50 + (45 * (step.index + 1)) / orderedSelectedGenres.length}
        />
        <h2 className="mb-1 text-lg font-bold text-zinc-900">{symptomHeading}</h2>
        <p className="mb-6 text-xs text-zinc-500">{copy["diagnosis.multi_select_hint"] ?? "いくつでも選択できます"}</p>

        <div className="grid grid-cols-1 gap-2">
          {genre.categories.map((c) => (
            <OptionButton
              key={c.categoryId}
              label={c.name}
              selected={selectedCategoryIds.includes(c.categoryId)}
              onClick={() => toggleCategory(c.categoryId)}
            />
          ))}
        </div>

        <NextButton
          disabled={selectedInThisGenre.length === 0}
          label={isLast ? copy["diagnosis.submit_button"] ?? "診断結果を見る" : copy["diagnosis.next_button"] ?? "次へ"}
          onClick={() => goToSymptomOrSubmit(step.index + 1)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
      <p className="text-sm text-zinc-600">
        {isPending ? copy["diagnosis.loading_text"] ?? "診断結果を作成しています..." : "少々お待ちください..."}
      </p>
    </div>
  );
}
