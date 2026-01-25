import { useState, useEffect } from "react";
import { BehaviorSubject } from "rxjs";

/**
 * Hook to subscribe to a BehaviorSubject and return its current value.
 * Updates the component whenever the subject emits a new value.
 * @param subject The BehaviorSubject to subscribe to.
 * @returns The current value of the subject.
 */
export function useBehaviorSubjectValue<T>(subject: BehaviorSubject<T>): T {
    const [value, setValue] = useState<T>(subject.getValue());

    useEffect(() => {
        const subscription = subject.subscribe(setValue);
        return () => subscription.unsubscribe();
    }, [subject]);

    return value;
}
