import { useState } from 'react';
import { ApiError, QueuedError, api } from '../api/client';
import type { WeightEntry } from '../api/types';
import { useApp } from '../app-state';
import { todayLocal } from '../lib/dates';
import { formatWeight, parseWeight, sanitizeWeightInput } from '../lib/weightInput';
import { DateField } from './DateField';

interface Props {
  entry?: WeightEntry | null;
  onClose: () => void;
}

export function WeightSheet({ entry, onClose }: Props): React.JSX.Element {
  const { refreshWeights } = useApp();
  const [date, setDate] = useState(entry?.date ?? todayLocal());
  const [draft, setDraft] = useState(entry ? formatWeight(entry.kg) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = saving || deleting;

  async function save(): Promise<void> {
    const kg = parseWeight(draft);
    if (kg === null) {
      setError('Введите вес цифрами с точкой, например 24.6');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (entry) {
        await api.updateWeight(entry.id, kg, date);
      } else {
        await api.upsertWeight(kg, date);
      }
      await refreshWeights();
      onClose();
    } catch (e) {
      if (e instanceof QueuedError) {
        // Queued for sync — the pending bar informs the user.
        onClose();
        return;
      }
      if (e instanceof ApiError && e.status === 409) {
        setError('На эту дату уже есть замер');
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(): Promise<void> {
    if (!entry || !window.confirm('Удалить этот замер?')) return;
    setError(null);
    setDeleting(true);
    try {
      await api.deleteWeight(entry.id);
      await refreshWeights();
      onClose();
    } catch (e) {
      if (e instanceof QueuedError) {
        onClose();
        return;
      }
      setError(e instanceof Error ? e.message : 'Не удалось удалить');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>{entry ? 'Изменить замер веса' : 'Новый замер веса'}</h3>
        <div className="field">
          <input
            value={draft}
            onChange={(e) => setDraft(sanitizeWeightInput(e.target.value))}
            inputMode="decimal"
            placeholder="24.6"
            aria-label="Вес в килограммах"
            className="big"
            disabled={busy}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#645c50', paddingRight: 8 }}>кг</span>
        </div>
        <DateField value={date} max={todayLocal()} onChange={setDate} label="Дата замера" disabled={busy} />
        {error && <div className="error-bar">{error}</div>}
        <button type="button" className="btn-accent" onClick={() => void save()} disabled={busy}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {entry && (
          <button type="button" className="btn-danger" onClick={() => void remove()} disabled={busy}>
            {deleting ? 'Удаляем…' : 'Удалить замер'}
          </button>
        )}
      </div>
    </div>
  );
}
