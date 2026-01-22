import { Button, Label, Select, TextInput } from "flowbite-react";
import type { FC, ComponentProps, ReactNode } from "react";
import { HiArrowDown, HiArrowUp, HiPlus, HiSearch } from "react-icons/hi";
import { ToolbarCard } from "./ToolbarCard";

type IconComponent = FC<ComponentProps<"svg">>;

export interface ListToolbarOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder?: string;
  queryId?: string;
  searchIcon?: IconComponent;

  sortField?: string;
  onSortFieldChange?: (value: string) => void;
  sortFieldOptions?: ListToolbarOption[];
  sortFieldLabel?: string;
  sortFieldId?: string;

  sortDir?: "asc" | "desc";
  onSortDirChange?: (value: "asc" | "desc") => void;
  sortDirLabel?: string;
  sortDirId?: string;

  addLabel?: string;
  onAdd?: () => void;
  addDisabled?: boolean;
  addIcon?: IconComponent;

  extra?: ReactNode;
}

export function ListToolbar({
  query,
  onQueryChange,
  queryPlaceholder = "Buscar...",
  queryId = "search",
  searchIcon: SearchIcon = HiSearch,

  sortField,
  onSortFieldChange,
  sortFieldOptions,
  sortFieldLabel = "Ordenar por",
  sortFieldId = "sort-field",

  sortDir = "asc",
  onSortDirChange,
  sortDirLabel = "Ordem",
  sortDirId = "sort-dir",

  addLabel = "Adicionar",
  onAdd,
  addDisabled,
  addIcon: AddIcon = HiPlus,
  extra,
}: ListToolbarProps) {
  const canToggleSortDir = typeof onSortDirChange === "function";

  return (
    <ToolbarCard
      left={(
        <TextInput
          id={queryId}
          type="text"
          icon={SearchIcon}
          placeholder={queryPlaceholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      )}
      right={(
        <>
          {extra}

          {sortFieldOptions && sortField && onSortFieldChange ? (
            <div className="w-full md:w-56">
              <Label
                htmlFor={sortFieldId}
                className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300"
              >
                {sortFieldLabel}
              </Label>
              <Select
                id={sortFieldId}
                value={sortField}
                onChange={(e) => onSortFieldChange(e.target.value)}
              >
                {sortFieldOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="w-full md:w-auto">
            <Label
              htmlFor={sortDirId}
              className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300"
            >
              {sortDirLabel}
            </Label>
            <Button
              id={sortDirId}
              color="gray"
              className="w-full md:w-auto"
              onClick={() => {
                if (!canToggleSortDir) return;
                onSortDirChange(sortDir === "asc" ? "desc" : "asc");
              }}
              disabled={!canToggleSortDir}
              title={sortDir === "asc" ? "Ordenar Z-A" : "Ordenar A-Z"}
            >
              {sortDir === "asc" ? "A-Z" : "Z-A"}
              {sortDir === "asc" ? (
                <HiArrowUp className="ml-2 -mr-1 h-5 w-5" />
              ) : (
                <HiArrowDown className="ml-2 -mr-1 h-5 w-5" />
              )}
            </Button>
          </div>

          {onAdd ? (
            <Button className="w-full md:w-auto" onClick={onAdd} disabled={addDisabled}>
              <span className="flex items-center gap-2">
                <AddIcon className="h-5 w-5" />
                {addLabel}
              </span>
            </Button>
          ) : null}
        </>
      )}
    />
  );
}
