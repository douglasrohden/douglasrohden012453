import { useSyncExternalStore } from "react";
import type { BehaviorSubject } from "rxjs";

/**
 * Subscribes to a BehaviorSubject and always exposes the latest value.
 * Uses React's external store API to avoid stale closures and double renders.
 */
export function useBehaviorSubjectValue<T>(subject: BehaviorSubject<T>): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      const subscription = subject.subscribe(onStoreChange);
      return () => subscription.unsubscribe();
    },
    () => subject.getValue(),
    () => subject.getValue(),
  );
}
