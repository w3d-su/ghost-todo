import { useState, type FormEvent } from "react";
import { HOUR_MS, TITLE_MAX } from "../game/constants";
import { CATEGORIES, CATEGORY_NAMES, type Category, type TaskDraft } from "../game/engine";

export function TaskForm({ now, onAdd }: { now: number; onAdd: (draft: TaskDraft) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("life");
  const [due, setDue] = useState("");
  const [late, setLate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("任務要有名字");
      return;
    }
    const dueAt = late ? now - HOUR_MS : due ? new Date(due).getTime() : null;
    if (dueAt !== null && Number.isNaN(dueAt)) {
      setError("這個期限不是有效的時間");
      return;
    }
    onAdd({ title, category, dueAt });
    setTitle("");
    setDue("");
    setLate(false);
    setError(null);
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <label htmlFor="task-title">新任務</label>
      <input
        id="task-title"
        value={title}
        maxLength={TITLE_MAX}
        placeholder="例如：寫完報告"
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="form-row">
        <div>
          <label htmlFor="task-category">分類</label>
          <select
            id="task-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_NAMES[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-due">期限（選填）</label>
          <input
            id="task-due"
            type="datetime-local"
            value={due}
            disabled={late}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
      </div>
      <label className="check">
        <input type="checkbox" checked={late} onChange={(e) => setLate(e.target.checked)} />
        已經逾期（立刻生出殭屍）
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" className="btn primary">
        新增任務
      </button>
    </form>
  );
}
