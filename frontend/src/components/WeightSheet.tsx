import { useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../app-state';
import { todayLocal } from '../lib/dates';
import { parseWeight, sanitizeWeightInput } from '../lib/weightInput';

export function WeightSheet({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { refreshWeights } = useApp();
  const [date, setDate] = useState(todayLocal());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(): Promise<void> {
    const kg = parseWeight(draft);
    if (kg === null) {
      setError('Введите вес цифрами с точкой, например 24.6');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.upsertWeight(kg, date);
      await refreshWeights();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>Новый замер веса</h3>
        <div className="field">
          <input
            value={draft}
            onChange={(e) => setDraft(sanitizeWeightInput(e.target.value))}
            inputMode="decimal"
            placeholder="24.6"
            aria-label="Вес в килограммах"
            className="big"
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#645c50', paddingRight: 8 }}>кг</span>
        </div>
        <div className="field">
          <input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Дата замера"
            style={{ fontSize: 16, fontWeight: 600 }}
          />
        </div>
        {error && <div className="error-bar">{error}</div>}
        <button type="button" className="btn-accent" onClick={() => void save()} disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
