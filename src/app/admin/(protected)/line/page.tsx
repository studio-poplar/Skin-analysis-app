import { prisma } from "@/lib/prisma";
import { updateLineSettingsAction } from "../../line-actions";

export default async function AdminLinePage(props: PageProps<"/admin/line">) {
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const settings = await prisma.lineSettings.findUnique({ where: { id: 1 } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">LINE導線管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        結果画面のLINE相談ボタンの共通設定です。症状カテゴリごとに個別のURL・メッセージを設定したい場合は、「診断フロー管理」の各カテゴリの編集フォームから設定できます(個別設定があるカテゴリが診断結果に含まれる場合は、そちらが優先されます)。
      </p>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {errorKey === "missing" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">URLとボタン文言は必須です。</p>
      )}

      <form action={updateLineSettingsAction} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">LINE誘導URL(共通)</span>
          <input
            type="url"
            name="lineUrl"
            required
            defaultValue={settings?.lineUrl ?? ""}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">ボタン文言</span>
          <input
            type="text"
            name="buttonText"
            required
            defaultValue={settings?.buttonText ?? "LINEで相談する"}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">バナー画像URL(任意・未設定なら非表示)</span>
          <input
            type="url"
            name="bannerImageUrl"
            defaultValue={settings?.bannerImageUrl ?? ""}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
        </label>
        <button type="submit" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          保存する
        </button>
      </form>
    </div>
  );
}
