import { HOUR_MS } from "../game/constants";
import { CATEGORY_NAMES, type Task } from "../game/engine";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function dueText(task: Task, now: number): string | null {
  if (task.dueAt === null) return null;
  if (task.status === "overdue") {
    const hours = Math.floor((now - task.dueAt) / HOUR_MS);
    return hours < 1 ? "剛逾期" : `逾期 ${hours} 小時`;
  }
  return `期限 ${formatTime(task.dueAt)}`;
}

export function TaskList({
  tasks,
  now,
  onComplete,
  onDelete,
}: {
  tasks: Task[];
  now: number;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  // 逾期的排最前面，其次依期限，沒有期限的放最後。
  const open = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || a.createdAt - b.createdAt;
    });
  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 20);

  return (
    <section className="tasks" aria-label="任務清單">
      {open.length === 0 ? (
        <p className="hint">沒有待辦的事了。新增一件任務，讓幽靈吃飽。</p>
      ) : (
        <ul>
          {open.map((task) => {
            const due = dueText(task, now);
            return (
              <li key={task.id} className={`task ${task.status}`}>
                <div className="task-main">
                  <p className="task-title">{task.title}</p>
                  <p className="task-meta">
                    <span className="tag">{CATEGORY_NAMES[task.category]}</span>
                    {due ? <span className="due">{due}</span> : null}
                  </p>
                </div>
                <div className="task-actions">
                  <button
                    className="btn primary"
                    aria-label={`完成「${task.title}」`}
                    onClick={() => onComplete(task.id)}
                  >
                    完成
                  </button>
                  <button
                    className="btn ghost"
                    aria-label={`刪除「${task.title}」`}
                    onClick={() => onDelete(task.id)}
                  >
                    刪除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {done.length > 0 ? (
        <details className="done-list">
          <summary>已完成（{done.length}）</summary>
          <ul>
            {done.map((task) => (
              <li key={task.id} className="task done">
                <p className="task-title">{task.title}</p>
                <button
                  className="btn ghost"
                  aria-label={`刪除「${task.title}」`}
                  onClick={() => onDelete(task.id)}
                >
                  刪除
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
