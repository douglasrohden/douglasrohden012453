import { useEffect, useState } from "react";
import { Observable } from "rxjs";

/**
 * Hook customizado para integração de RxJS Observables com React
 * @param observable - Observable do RxJS
 * @param initialValue - Valor inicial do estado
 * @returns Valor atual do Observable
 */
export function useObservable<T>(
  observable: Observable<T>,
  initialValue: T,
): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable.subscribe(setValue);

    // Cleanup: unsubscribe quando o componente desmontar
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
