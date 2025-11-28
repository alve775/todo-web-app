"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const initialTodos = [
  { id: "welcome", text: "Sketch today's plan", done: false },
  { id: "ui", text: "Build the new Next.js todo UI", done: true },
  { id: "review", text: "Clear out or archive finished tasks", done: false },
];

const filters = {
  all: { label: "All", predicate: () => true },
  active: { label: "Active", predicate: (todo) => !todo.done },
  completed: { label: "Done", predicate: (todo) => todo.done },
};

function createTodo(text, reminder) {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;
  return { id, text, done: false, reminder, reminderSent: false };
}

function toInputValue(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatReminder(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const [todos, setTodos] = useState(initialTodos);
  const [draft, setDraft] = useState("");
  const [reminderDraft, setReminderDraft] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [reminderEditValue, setReminderEditValue] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const timersRef = useRef({});

  const filteredTodos = useMemo(() => {
    const filter = filters[activeFilter] ?? filters.all;
    return todos.filter((todo) => filter.predicate(todo));
  }, [activeFilter, todos]);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.done).length,
    [todos],
  );
  const remainingCount = todos.length - completedCount;

  const notify = useCallback(
    async (todo) => {
      if (typeof window === "undefined") return;

      const notificationsSupported =
        typeof Notification !== "undefined" &&
        notificationPermission !== "unsupported";

      if (notificationsSupported) {
        let permission = notificationPermission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
          setNotificationPermission(permission);
        }

        if (permission === "granted") {
          new Notification("Task reminder", {
            body: `${todo.text} is due now`,
            tag: todo.id,
          });
          return;
        }
      }

      // Fallback if notifications are blocked or unsupported.
      alert(`Reminder: ${todo.text}`);
    },
    [notificationPermission],
  );

  const triggerReminder = useCallback(
    (todo) => {
      notify(todo);
      setTodos((prev) =>
        prev.map((item) =>
          item.id === todo.id ? { ...item, reminderSent: true } : item,
        ),
      );
    },
    [notify],
  );

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    timersRef.current = {};

    todos.forEach((todo) => {
      if (!todo.reminder || todo.done || todo.reminderSent) return;
      const reminderTime = new Date(todo.reminder).getTime();
      if (Number.isNaN(reminderTime)) return;
      const delay = reminderTime - Date.now();
      if (delay <= 0) {
        triggerReminder(todo);
        return;
      }
      const timerId = setTimeout(() => triggerReminder(todo), delay);
      timersRef.current[todo.id] = timerId;
    });
  }, [todos, triggerReminder]);

  function addTodo(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const reminderDate = reminderDraft ? new Date(reminderDraft) : null;
    const reminder =
      reminderDate && !Number.isNaN(reminderDate.getTime())
        ? reminderDate.toISOString()
        : null;

    setTodos((prev) => [createTodo(text, reminder), ...prev]);
    setDraft("");
    setReminderDraft("");
  }

  function toggleTodo(id) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  function removeTodo(id) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((todo) => !todo.done));
  }

  function startEditingReminder(todo) {
    setEditingReminderId(todo.id);
    setReminderEditValue(toInputValue(todo.reminder));
  }

  function saveReminder(id) {
    const nextReminder = reminderEditValue
      ? new Date(reminderEditValue)
      : null;

    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== id) return todo;
        if (!nextReminder || Number.isNaN(nextReminder.getTime())) {
          return { ...todo, reminder: null, reminderSent: false };
        }
        return {
          ...todo,
          reminder: nextReminder.toISOString(),
          reminderSent: false,
        };
      }),
    );

    setEditingReminderId(null);
    setReminderEditValue("");
  }

  function clearReminder(id) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, reminder: null, reminderSent: false } : todo,
      ),
    );
    setEditingReminderId(null);
    setReminderEditValue("");
  }

  function cancelEditingReminder() {
    setEditingReminderId(null);
    setReminderEditValue("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1021] via-[#0f172a] to-[#05060d] text-slate-100">
      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-blue-200/70">
              Todo Studio
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              Organize your day with intent
            </h1>
            <p className="mt-1 text-sm text-slate-300/80">
              Add tasks, set reminders, and stay on track.
            </p>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-200 shadow-lg shadow-blue-500/10">
            {completedCount} done | {remainingCount} left
          </div>
        </header>

        <section className="mt-10 space-y-6">
          <form
            onSubmit={addTodo}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-blue-500/10 backdrop-blur"
          >
            <label className="text-sm font-medium text-slate-200">
              Add a task
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write the next thing to finish..."
                className="flex-1 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-base text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Add task
              </button>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-500/20 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Reminder
                </span>
                <span className="text-xs text-slate-400">
                  Optional date and time for a browser notification.
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="datetime-local"
                  value={reminderDraft}
                  onChange={(event) => setReminderDraft(event.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setReminderDraft("")}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-red-200 hover:text-red-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, filter]) => {
                const isActive = activeFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFilter(key)}
                    aria-pressed={isActive}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-500 text-white shadow shadow-blue-500/30"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:border-blue-300/60"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </form>

          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-slate-300/90">
                {todos.length === 0
                  ? "No tasks yet. Add your first one to get started."
                  : "Nothing to show for this filter."}
              </div>
            ) : (
              filteredTodos.map((todo) => {
                const reminderDate = todo.reminder
                  ? new Date(todo.reminder)
                  : null;
                const isOverdue =
                  reminderDate && reminderDate.getTime() <= Date.now();
                const reminderStatus = todo.reminder
                  ? todo.reminderSent
                    ? "Reminder sent"
                    : isOverdue
                      ? "Due now"
                      : "Scheduled"
                  : "Not set";

                return (
                  <article
                    key={todo.id}
                    className="group rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-md shadow-blue-500/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:shadow-blue-500/20"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border transition ${
                          todo.done
                            ? "border-blue-400 bg-blue-500 text-white"
                            : "border-white/30 bg-slate-950/60 text-slate-200 hover:border-blue-300/70"
                        }`}
                        aria-pressed={todo.done}
                        aria-label={
                          todo.done ? "Mark as not done" : "Mark as done"
                        }
                      >
                        {todo.done ? "\u2713" : ""}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p
                              className={`text-lg ${
                                todo.done
                                  ? "text-slate-400 line-through"
                                  : "text-slate-50"
                              }`}
                            >
                              {todo.text}
                            </p>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              {todo.done ? "Complete" : "In progress"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTodo(todo.id)}
                            className="text-xs font-semibold text-slate-300 transition hover:text-red-200"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-500/30 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-50">
                              Reminder
                            </span>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                todo.reminder
                                  ? todo.reminderSent
                                    ? "bg-emerald-500/20 text-emerald-100"
                                    : isOverdue
                                      ? "bg-red-500/20 text-red-100"
                                      : "bg-white/10 text-blue-100"
                                  : "bg-white/10 text-slate-300"
                              }`}
                            >
                              {reminderStatus}
                            </span>
                            {todo.reminder && (
                              <span className="text-sm text-slate-200">
                                {formatReminder(todo.reminder)}
                              </span>
                            )}
                            {!todo.reminder && (
                              <span className="text-sm text-slate-400">
                                No reminder set
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditingReminder(todo)}
                              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-blue-200 hover:text-blue-100"
                            >
                              {todo.reminder ? "Edit reminder" : "Set reminder"}
                            </button>
                            {todo.reminder && (
                              <button
                                type="button"
                                onClick={() => clearReminder(todo.id)}
                                className="rounded-lg border border-red-200/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/20"
                              >
                                Clear reminder
                              </button>
                            )}
                          </div>

                          {editingReminderId === todo.id && (
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                              <input
                                type="datetime-local"
                                value={reminderEditValue}
                                onChange={(event) =>
                                  setReminderEditValue(event.target.value)
                                }
                                className="flex-1 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveReminder(todo.id)}
                                  className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingReminder}
                                  className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {completedCount > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <p>
                Nice work-{completedCount} task
                {completedCount > 1 ? "s" : ""} done.
              </p>
              <button
                type="button"
                onClick={clearCompleted}
                className="rounded-lg px-3 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                Clear completed
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
