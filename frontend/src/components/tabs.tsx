import { useApp } from '../app-state';

/** Step 7 placeholder — full UI lands in Step 8. */
export function HomeTab(): React.JSX.Element {
  const { walkers, weights } = useApp();
  return (
    <div className="stub">
      Главная: выгульщиков — {walkers.length}, замеров — {weights.length}
    </div>
  );
}

export function MonthTab(): React.JSX.Element {
  return <div className="stub">Месяц</div>;
}

export function WeightTab(): React.JSX.Element {
  const { weights } = useApp();
  return <div className="stub">Вес: записей — {weights.length}</div>;
}

export function PetTab(): React.JSX.Element {
  const { pet } = useApp();
  return <div className="stub">Питомец: {pet?.name ?? '…'}</div>;
}
