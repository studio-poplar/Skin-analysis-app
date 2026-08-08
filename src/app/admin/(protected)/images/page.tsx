import { prisma } from "@/lib/prisma";
import { addImageAction, deleteImageAction, updateImageAction } from "../../images-actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "画像URLを入力してください。",
};

export default async function AdminImagesPage(props: PageProps<"/admin/images">) {
  const searchParams = await props.searchParams;
  const created = searchParams?.created === "1";
  const saved = searchParams?.saved === "1";
  const deleted = searchParams?.deleted === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const images = await prisma.siteImage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">画像管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        画像はURLを登録する簡易的なメディアライブラリです(今回はURL登録のみで、ファイルアップロード機能は今後の拡張で対応予定です)。外部の画像ホスティングサービス等にアップロードしたURLを登録してください。
      </p>

      {created && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">画像を登録しました。</p>}
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {deleted && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">削除しました。</p>}
      {errorKey && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{ERROR_MESSAGES[errorKey] ?? "エラーが発生しました。"}</p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.map((img) => (
          <form key={img.id} action={updateImageAction} className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-zinc-100">
            <input type="hidden" name="id" value={img.id} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.altText ?? ""}
              className="mb-2 h-24 w-full rounded-lg bg-zinc-100 object-cover"
            />
            <input
              type="url"
              name="url"
              defaultValue={img.url}
              className="mb-1 w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs"
            />
            <input
              type="text"
              name="altText"
              defaultValue={img.altText ?? ""}
              placeholder="alt(代替テキスト)"
              className="mb-1 w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs"
            />
            <input
              type="text"
              name="folder"
              defaultValue={img.folder ?? ""}
              placeholder="フォルダ(任意)"
              className="mb-1 w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs"
            />
            <input
              type="text"
              name="usage"
              defaultValue={img.usage ?? ""}
              placeholder="用途メモ(任意)"
              className="mb-2 w-full rounded-lg border border-zinc-200 px-2 py-1 text-xs"
            />
            <div className="flex items-center gap-2">
              <button type="submit" className="flex-1 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                保存
              </button>
            </div>
          </form>
        ))}
      </div>

      {images.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {images.map((img) => (
            <form key={`del-${img.id}`} action={deleteImageAction}>
              <input type="hidden" name="id" value={img.id} />
              <button type="submit" className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                {img.altText || img.url.slice(0, 20)} を削除
              </button>
            </form>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <h2 className="mb-4 font-semibold text-zinc-900">新しい画像を登録</h2>
        <form action={addImageAction} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">画像URL</span>
            <input type="url" name="url" required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">alt(代替テキスト)</span>
              <input type="text" name="altText" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">フォルダ(任意)</span>
              <input type="text" name="folder" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">用途メモ(任意)</span>
            <input type="text" name="usage" placeholder="例: TOPページ ヒーロー画像" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
          </label>
          <button type="submit" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            登録する
          </button>
        </form>
      </div>
    </div>
  );
}
