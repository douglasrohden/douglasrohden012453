import type { ReactNode } from "react";

interface ToolbarCardProps {
  left: ReactNode;
  right?: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

function mergeClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ToolbarCard({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
}: ToolbarCardProps) {
  return (
    <div
      className={mergeClassNames(
        "mb-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between dark:border-gray-700 dark:bg-gray-800",
        className,
      )}
    >
      <div className={mergeClassNames("w-full md:w-1/3", leftClassName)}>
        {left}
      </div>

      {right ? (
        <div
          className={mergeClassNames(
            "flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-end",
            rightClassName,
          )}
        >
          {right}
        </div>
      ) : null}
    </div>
  );
}
