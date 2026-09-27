import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApp } from '../app-state';

export function LockScreen(): React.JSX.Element {
  const { login, authError } = useApp();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    try {
      await login(password);
      setPassword('');
    } catch {
      // authError is shown from state
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lock">
      <div className="badge">🔒</div>
      <div>
        <h2>Введите пароль</h2>
        <p>Чтобы никто посторонний не зашёл в приложение питомца</p>
      </div>
      <form onSubmit={submit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <input
          type="password"
          placeholder="Пароль"
          aria-label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button className="btn-accent" type="submit" disabled={busy}>
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
      <span className="hint">{authError ?? ''}</span>
    </div>
  );
}
