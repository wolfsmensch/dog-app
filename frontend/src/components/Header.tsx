import { useEffect } from 'react';
import { useApp } from '../app-state';

export function Header(): React.JSX.Element {
  const { pet } = useApp();
  const name = pet?.name?.trim() || 'Питомец';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    document.title = name;
  }, [name]);

  return (
    <header className="topbar">
      <h1>{name}</h1>
      {pet?.photoUrl ? (
        <img className="avatar avatar-ring" src={pet.photoUrl} alt="Фото питомца" />
      ) : (
        <div className="avatar avatar-ring avatar-fallback">{initial}</div>
      )}
    </header>
  );
}
