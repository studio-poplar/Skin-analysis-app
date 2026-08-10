import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/admin-session";
import { DEFAULT_CATEGORY_STYLE, PRODUCT_CATEGORIES } from "@/lib/product-categories";
import { resetCategoryColorAction, updateCategoryColorAction, updateDesignSettingsAction } from "../../design-actions";

export default async function AdminDesignPage(props: PageProps<"/admin/design">) {
  const session = await getCurrentSession();
  if (session?.role !== "admin") {
    redirect("/admin");
  }

  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const [design, categoryColorRows] = await Promise.all([
    prisma.designSettings.findUnique({ where: { id: 1 } }),
    prisma.categoryColor.findMany(),
  ]);
  const categoryColorMap = new Map(categoryColorRows.map((r) => [r.category, r]));

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
      {errorKey === "category_color" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          カテゴリの色は #ffffff のような6桁のカラーコードで指定してください。
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
          <span className="mb-1 block text-zinc-600">本文テキストの色(任意・未設定なら既定の配色)</span>
          <div className="flex items-center gap-3">
            <input
              type="color"
              defaultValue={design?.bodyTextColorHex ?? "#18181b"}
              className="h-10 w-14 rounded-lg border border-zinc-200"
              id="body-color-picker"
            />
            <input
              type="text"
              name="bodyTextColorHex"
              defaultValue={design?.bodyTextColorHex ?? ""}
              pattern="^#[0-9a-fA-F]{6}$"
              placeholder="未設定"
              className="w-32 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              id="body-color-text"
            />
          </div>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">フォント</span>
          <select
            name="fontFamily"
            defaultValue={design?.fontFamily ?? "sans"}
            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          >
            <option value="sans">ゴシック体(既定)</option>
            <option value="serif">明朝体</option>
            <option value="mono">等幅</option>
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

      {/* v11差分指示書(節7-22)追加: 製品カテゴリごとのタグ色・枠線色。診断結果ページの
          「おすすめのお手入れステップ」「それを補完するアイテム」の両方に反映される。 */}
      <div className="mt-10 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <h2 className="mb-1 text-base font-bold text-zinc-900">カテゴリタグ・枠線の色</h2>
        <p className="mb-4 text-xs text-zinc-500">
          製品管理(/admin/products)で使われている製品カテゴリごとに、診断結果ページのタグ・カード枠線の色を設定できます。
          未設定のカテゴリはグレー系の既定色で表示されます(設定は必須ではありません)。文字色はタグの背景色から自動で読みやすい色を選びます。
        </p>
        <div className="space-y-3">
          {PRODUCT_CATEGORIES.map((category, i) => {
            const row = categoryColorMap.get(category);
            const tagDefault = row?.tagColorHex ?? DEFAULT_CATEGORY_STYLE.tagBg;
            const borderDefault = row?.borderColorHex ?? DEFAULT_CATEGORY_STYLE.border;
            return (
              <div key={category} className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 p-3">
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: tagDefault, borderColor: borderDefault, borderWidth: 2 }}
                >
                  {category}
                </span>
                <form action={updateCategoryColorAction} className="flex flex-1 flex-wrap items-center gap-3">
                  <input type="hidden" name="category" value={category} />
                  <label className="flex items-center gap-2 text-xs text-zinc-500">
                    タグ色
                    <input
                      type="color"
                      defaultValue={tagDefault}
                      className="h-8 w-10 rounded border border-zinc-200"
                      id={`cat-tag-picker-${i}`}
                    />
                    <input
                      type="text"
                      name="tagColorHex"
                      defaultValue={tagDefault}
                      pattern="^#[0-9a-fA-F]{6}$"
                      className="w-24 rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                      id={`cat-tag-text-${i}`}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-500">
                    枠線色
                    <input
                      type="color"
                      defaultValue={borderDefault}
                      className="h-8 w-10 rounded border border-zinc-200"
                      id={`cat-border-picker-${i}`}
                    />
                    <input
                      type="text"
                      name="borderColorHex"
                      defaultValue={borderDefault}
                      pattern="^#[0-9a-fA-F]{6}$"
                      className="w-24 rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                      id={`cat-border-text-${i}`}
                    />
                  </label>
                  <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                    保存
                  </button>
                </form>
                {row && (
                  <form action={resetCategoryColorAction}>
                    <input type="hidden" name="category" value={category} />
                    <button type="submit" className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                      既定に戻す
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var picker = document.getElementById('color-picker');
              var text = document.getElementById('color-text');
              if (picker && text) {
                picker.addEventListener('input', function() { text.value = picker.value; });
                text.addEventListener('input', function() { if (/^#[0-9a-fA-F]{6}$/.test(text.value)) picker.value = text.value; });
              }
              var bodyPicker = document.getElementById('body-color-picker');
              var bodyText = document.getElementById('body-color-text');
              if (bodyPicker && bodyText) {
                bodyPicker.addEventListener('input', function() { bodyText.value = bodyPicker.value; });
                bodyText.addEventListener('input', function() { if (/^#[0-9a-fA-F]{6}$/.test(bodyText.value)) bodyPicker.value = bodyText.value; });
              }
              // v11差分指示書(節7-22): カテゴリごとのタグ色・枠線色のcolor picker⇔テキスト同期
              for (var i = 0; i < ${PRODUCT_CATEGORIES.length}; i++) {
                (function(idx) {
                  ['tag', 'border'].forEach(function(kind) {
                    var p = document.getElementById('cat-' + kind + '-picker-' + idx);
                    var t = document.getElementById('cat-' + kind + '-text-' + idx);
                    if (p && t) {
                      p.addEventListener('input', function() { t.value = p.value; });
                      t.addEventListener('input', function() { if (/^#[0-9a-fA-F]{6}$/.test(t.value)) p.value = t.value; });
                    }
                  });
                })(i);
              }
            })();
          `,
        }}
      />
    </div>
  );
}
