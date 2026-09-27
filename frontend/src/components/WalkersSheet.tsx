import { useState } from 'react';
import { QueuedError, api } from '../api/client';
import { useApp } from '../app-state';
import { WALKER_PALETTE } from '../lib/queue';

const MAX_WALKERS = 10;

export function WalkersSheet({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { walkers, todayWalkerId, refreshWalk } = useApp();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [paletteFor, setPaletteFor] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      await fn();
      await refreshWalk();
    } catch (e) {
      // QueuedError means the change is stored in the outbox;
      // the pending bar informs the user, no error shown.
      if (!(e instanceof QueuedError)) {
        setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      }
    } finally {
      setBusy(false);
    }
  }

  function startEdit(id: number, name: string): void {
    setEditingId(id);
    setEditName(name);
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div>
          <h3>Выгульщики</h3>
          <div className="hint">Нажмите на человека, чтобы поставить его на сегодня</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {walkers.map((w) => {
            const isToday = w.id === todayWalkerId;
            const editing = editingId === w.id;
            return (
              <div key={w.id} className={`walker-row${isToday ? ' today' : ''}`}>
                <div className="walker-line">
                  <button
                    type="button"
                    className="walker-initial"
                    style={{ background: w.color }}
                    aria-label="Изменить цвет"
                    disabled={busy}
                    onClick={() => setPaletteFor(paletteFor === w.id ? null : w.id)}
                  >
                    {w.name.trim().charAt(0).toUpperCase() || '?'}
                  </button>
                  <button
                    type="button"
                    className="walker-name"
                    aria-label="Назначить на сегодня"
                    disabled={busy}
                    onClick={() => void run(() => api.setToday(w.id))}
                  >
                    {editing ? (
                      <input
                        value={editName}
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            void run(async () => {
                              await api.updateWalker(w.id, { name: editName.trim() || w.name });
                              setEditingId(null);
                            });
                          }
                        }}
                        aria-label="Имя выгульщика"
                      />
                    ) : (
                      <>
                        <b>{w.name}</b>
                        <span className={isToday ? 'istoday' : ''}>
                          {isToday ? 'Выгуливает сегодня' : 'В очереди'}
                        </span>
                      </>
                    )}
                  </button>
                  {editing ? (
                    <button
                      type="button"
                      className="icon-btn accent"
                      aria-label="Сохранить имя"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await api.updateWalker(w.id, { name: editName.trim() || w.name });
                          setEditingId(null);
                        })
                      }
                    >
                      ✓
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Изменить имя"
                      disabled={busy}
                      onClick={() => startEdit(w.id, w.name)}
                    >
                      ✎
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Удалить выгульщика"
                    disabled={busy || walkers.length <= 1}
                    onClick={() => {
                      if (window.confirm(`Удалить ${w.name} из очереди?`)) {
                        void run(async () => {
                          await api.deleteWalker(w.id);
                          if (editingId === w.id) setEditingId(null);
                        });
                      }
                    }}
                  >
                    🗑
                  </button>
                </div>
                {paletteFor === w.id && (
                  <div className="palette">
                    <span className="label">Цвет выгульщика</span>
                    <div className="grid">
                      {WALKER_PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="swatch"
                          style={{
                            background: c,
                            boxShadow:
                              c.toLowerCase() === w.color.toLowerCase()
                                ? '0 0 0 2.5px #fbf6ec, 0 0 0 4.5px rgba(32,30,29,.5)'
                                : 'none',
                          }}
                          aria-label="Выбрать цвет"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api.updateWalker(w.id, { color: c });
                              setPaletteFor(null);
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {walkers.length < MAX_WALKERS ? (
          <div className="field">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Имя нового выгульщика"
              aria-label="Имя нового выгульщика"
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  void run(async () => {
                    await api.createWalker(newName.trim());
                    setNewName('');
                  });
                }
              }}
            />
            <button
              type="button"
              className="icon-btn accent"
              style={{ width: 40, height: 40, fontSize: 20 }}
              aria-label="Добавить выгульщика"
              disabled={busy || !newName.trim()}
              onClick={() =>
                void run(async () => {
                  await api.createWalker(newName.trim());
                  setNewName('');
                })
              }
            >
              +
            </button>
          </div>
        ) : (
          <div className="hint">Максимум {MAX_WALKERS} выгульщиков</div>
        )}

        {error && <div className="error-bar">{error}</div>}

        <button type="button" className="btn-dark" onClick={onClose}>
          Готово
        </button>
      </div>
    </div>
  );
}
