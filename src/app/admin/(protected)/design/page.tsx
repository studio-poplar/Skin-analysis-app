import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/admin-session";
import { updateDesignSettingsAction } from "../../design-actions";

export default async function AdminDesignPage(props: PageProps<"/admin/design">) {
  const session = await getCurrentSession();
  if (session?.role !== "admin") {
    redirect("/admin");
  }

  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const design = await prisma.designSettings.findUnique({ where: { id: 1 } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">デザイン設定</h1>
      <p className="mb-6 text-sm text-zinc-500">
        サイト全体のブランドカラーとボタンの形状を設定できます(管理者のみ変更可能)。主要なCTAボタン(トップの診断開始ボタン、診断ウィザードの「次へ」、LINE相談ボタンの形状)に反映されます。
      </p>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {errorKey === "color" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          ブランドカラーは #ffffff のような6桁のカラーコードで指定してください。
        </p>
      )}

      <form action={updateDesignSettingsAction} className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">ブランドカラー</span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              defaultValue={design?.primaryColorHex ?? "#e11d48"}
              className="h-10 w-14 rounded-lg border border-zinc-200"
              id="color-picker"
            />
            <input
              type="text"
              name="primaryColorHex"
              defaultValue={design?.primaryColorHex ?? "#e11d48"}
              pattern="^#[0-9a-fA-F]{6}$"
              placeholder="#e11d48"
              className="w-32 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              id="color-text"
            />
          </div>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">ボタン形状</span>
          <select
            name="buttonStyle"
            defaultValue={design?.buttonStyle ?? "rounded-full"}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          >
            <option value="rounded-full">丸型(pill)</option>
            <option value="rounded-lg">角丸</option>
            <option value="square">四角</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">ロゴ画像URL(任意・現在のUIでは未使用、将来の拡張用)</span>
          <input
            type="url"
            name="logoUrl"
            defaultValue={design?.logoUrl ?? ""}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">ファビコンURL(任意)</span>
          <input
            type="url"
            name="faviconUrl"
            defaultValue={design?.faviconUrl ?? ""}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
        </label>

        <button type="submit" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
          保存する
        </button>
      </form>

      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var picker = document.getElementById('color-picker');
              var text = document.getElementById('color-text');
              if (!picker || !text) return;
              picker.addEventListener('input', function() { text.value = picker.value; });
              text.addEventListener('input', function() { if (/^#[0-9a-fA-F]{6}$/.test(text.value)) picker.value = text.value; });
            })();
          `,
        }}
      />
    </div>
  );
}
