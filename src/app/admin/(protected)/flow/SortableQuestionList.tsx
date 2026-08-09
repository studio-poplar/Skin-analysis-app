"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  addBasicOptionAction,
  removeBasicOptionAction,
  reorderQuestionsAction,
  updateBasicOptionAction,
  updateBasicQuestionAction,
} from "../../flow-actions";

type QuestionWithOptions = {
  questionId: number;
  questionText: string;
  questionType: string;
  options: { optionId: number; optionText: string }[];
};

// Step単位(基本情報/ライフスタイル設問)の質問一覧を、ドラッグ&ドロップで並び替えられるようにする(v8)。
// Stepをまたいだ並び替えは対象外のため、渡された配列の中だけで並び替える。
export function SortableQuestionList({ questions }: { questions: QuestionWithOptions[] }) {
  const [items, setItems] = useState(questions);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((q) => q.questionId === active.id);
      const newIndex = prev.findIndex((q) => q.questionId === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(() => {
        reorderQuestionsAction(next.map((q) => q.questionId));
      });
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((q) => q.questionId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((q) => (
            <SortableQuestionItem key={q.questionId} question={q} />
          ))}
        </div>
      </SortableContext>
      {isPending && <p className="mt-2 text-xs text-zinc-400">並び順を保存しています...</p>}
    </DndContext>
  );
}

function SortableQuestionItem({ question: q }: { question: QuestionWithOptions }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.questionId });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab touch-none rounded px-1 py-1 text-lg leading-none text-zinc-400 hover:bg-zinc-100 active:cursor-grabbing"
          title="ドラッグして並び替え"
        >
          ⠿
        </button>
        <form action={updateBasicQuestionAction} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="questionId" value={q.questionId} />
          <input
            type="text"
            name="questionText"
            defaultValue={q.questionText}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
            {q.questionType === "multi_select" ? "複数選択" : "単一選択"}
          </span>
          <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
            保存
          </button>
        </form>
      </div>
      <div className="space-y-2 pl-8">
        {q.options.map((o) => (
          <div key={o.optionId} className="flex items-center gap-2">
            <form action={updateBasicOptionAction} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="optionId" value={o.optionId} />
              <input
                type="text"
                name="optionText"
                defaultValue={o.optionText}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1 text-sm"
              />
              <button type="submit" className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                保存
              </button>
            </form>
            <form action={removeBasicOptionAction}>
              <input type="hidden" name="optionId" value={o.optionId} />
              <button type="submit" className="rounded-full border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                削除
              </button>
            </form>
          </div>
        ))}
        <form action={addBasicOptionAction} className="flex items-center gap-2 pt-1">
          <input type="hidden" name="questionId" value={q.questionId} />
          <input
            type="text"
            name="optionText"
            placeholder="選択肢を追加"
            className="flex-1 rounded-lg border border-dashed border-zinc-300 px-3 py-1 text-sm"
          />
          <button type="submit" className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200">
            追加
          </button>
        </form>
      </div>
    </div>
  );
}
