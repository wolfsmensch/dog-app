import { useEffect, useRef, useState } from 'react';
import { QueuedError, api } from '../api/client';
import { useApp } from '../app-state';
import { calcAge } from '../lib/age';
import { todayLocal } from '../lib/dates';
import { downscaleImage } from '../lib/photo';

export function PetTab(): React.JSX.Element {
  const { pet, refreshPet } = useApp();
  const [name, setName] = useState(pet?.name ?? '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(pet?.name ?? '');
  }, [pet?.name]);

  async function saveName(): Promise<void> {
    const next = name.trim();
    if (!next || next === pet?.name) {
      setName(pet?.name ?? '');
      return;
    }
    setSaving(true);
    try {
      await api.updatePet({ name: next });
      await refreshPet();
    } catch (e) {
      // Queued for sync — the pending bar informs the user.
      if (e instanceof QueuedError) {
        setName(next);
        return;
      }
      setName(pet?.name ?? '');
    } finally {
      setSaving(false);
    }
  }

  async function saveBirth(date: string): Promise<void> {
    if (!date || date === pet?.birthDate) return;
    setSaving(true);
    try {
      await api.updatePet({ birthDate: date });
      await refreshPet();
    } finally {
      setSaving(false);
    }
  }

  async function pickPhoto(file: File | undefined): Promise<void> {
    if (!file) return;
    setSaving(true);
    try {
      const small = await downscaleImage(file);
      await api.uploadPhoto(small);
      await refreshPet();
    } finally {
      setSaving(false);
    }
  }

  const age = pet?.birthDate ? calcAge(pet.birthDate, todayLocal()) : null;
  const initial = (pet?.name ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <>
      <span className="section-title">Питомец</span>

      <div className="panel" style={{ alignItems: 'center', padding: 20 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Выбрать фото"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
        >
          {pet?.photoUrl ? (
            <img className="avatar avatar-ring avatar-lg" src={pet.photoUrl} alt="Фото питомца" />
          ) : (
            <div className="avatar avatar-ring avatar-lg avatar-fallback">{initial}</div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            void pickPhoto(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <span style={{ fontSize: 12.5, color: '#82796a', textAlign: 'center', maxWidth: 230 }}>
          Фотография показывается в шапке приложения. Нажмите на круг, чтобы выбрать другую.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="form-label">Имя питомца</span>
        <div className="text-input">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void saveName()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            aria-label="Имя питомца"
            disabled={saving}
          />
        </div>
        <span style={{ fontSize: 11.5, color: '#a19786', paddingLeft: 18 }}>
          Используется как заголовок приложения
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span className="form-label">Дата рождения</span>
        <div className="text-input">
          <input
            type="date"
            value={pet?.birthDate ?? ''}
            onChange={(e) => void saveBirth(e.target.value)}
            aria-label="Дата рождения"
            disabled={saving}
          />
        </div>
      </div>

      {age && (
        <div className="age-banner">
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(32,30,29,.62)' }}>
            Сейчас возраст
          </span>
          <span>
            <b style={{ fontSize: 26, fontWeight: 900 }}>{age.years}</b>{' '}
            <span style={{ fontSize: 14, fontWeight: 600 }}>{age.yearsWord}</span>{' '}
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(32,30,29,.6)' }}>
              и {age.months} {age.monthsWord}
            </span>
          </span>
        </div>
      )}
    </>
  );
}
