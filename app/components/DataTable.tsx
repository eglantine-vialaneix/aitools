"use client";

import { useMemo, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";

export type SortDirection = "ascending" | "descending";
export type SortConfig = {
  column: string;
  direction: SortDirection;
} | null;

type DropPosition = "before" | "after";
type DragTarget = {
  column: string;
  position: DropPosition;
} | null;

type DataTableProps<TRow extends Record<string, unknown>> = {
  headers: string[];
  rows: TRow[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  getRowKey: (row: TRow, rowIndex: number) => string;
  getHeaderClassName?: (header: string, columnIndex: number, orderedHeaders: string[]) => string;
  getHeaderButtonClassName?: (header: string, columnIndex: number, orderedHeaders: string[]) => string;
  getCellClassName?: (row: TRow, header: string, rowIndex: number, columnIndex: number, orderedHeaders: string[]) => string;
  renderHeaderAdornment?: (header: string, columnIndex: number, orderedHeaders: string[]) => ReactNode;
  renderCell?: (
    row: TRow,
    header: string,
    rowIndex: number,
    columnIndex: number,
    defaultContent: ReactNode,
  ) => ReactNode;
};

const LABEL_COLUMN = "régime_alimentaire";
const NAME_COLUMN = "nom";
const PREDICTION_COLUMN = "régime_alimentaire_prédit";
const DIET_COLUMNS = [LABEL_COLUMN, PREDICTION_COLUMN];
const LOCKED_LEADING_COLUMNS = [NAME_COLUMN, LABEL_COLUMN];
const NAME_COLUMN_WIDTH = 150;
const LABEL_COLUMN_WIDTH = 190;

export function formatTableCellValue(value: unknown) {
  if (value === true || value === "True" || value === "true") {
    return "Vrai";
  }

  if (value === false || value === "False" || value === "false") {
    return "Faux";
  }

  return String(value ?? "");
}

function lockedLeadingColumns(headers: string[]) {
  return LOCKED_LEADING_COLUMNS.filter((header) => headers.includes(header));
}

function isLockedColumn(header: string) {
  return LOCKED_LEADING_COLUMNS.includes(header);
}

function defaultColumnOrder(headers: string[]) {
  const lockedColumns = lockedLeadingColumns(headers);
  const unlockedColumns = headers.filter((header) => !lockedColumns.includes(header));
  const orderedHeaders = [...lockedColumns, ...unlockedColumns];

  if (!headers.includes(PREDICTION_COLUMN) || !headers.includes(LABEL_COLUMN)) {
    return orderedHeaders;
  }

  const headersWithoutPrediction = orderedHeaders.filter((header) => header !== PREDICTION_COLUMN);
  const labelIndex = headersWithoutPrediction.indexOf(LABEL_COLUMN);

  if (labelIndex === -1) {
    return headers;
  }

  return [
    ...headersWithoutPrediction.slice(0, labelIndex + 1),
    PREDICTION_COLUMN,
    ...headersWithoutPrediction.slice(labelIndex + 1),
  ];
}

function reconcileColumnOrder(currentOrder: string[], headers: string[]) {
  const initialOrder = defaultColumnOrder(headers);
  const lockedColumns = lockedLeadingColumns(headers);

  if (currentOrder.length === 0) {
    return initialOrder;
  }

  const knownColumns = currentOrder.filter((column) => headers.includes(column) && !lockedColumns.includes(column));
  const newColumns = initialOrder.filter((column) => !lockedColumns.includes(column) && !knownColumns.includes(column));

  return [...lockedColumns, ...knownColumns, ...newColumns];
}

function moveColumn(
  columns: string[],
  draggedColumn: string,
  targetColumn: string,
  position: DropPosition,
) {
  if (draggedColumn === targetColumn || isLockedColumn(draggedColumn) || isLockedColumn(targetColumn)) {
    return columns;
  }

  const withoutDraggedColumn = columns.filter((column) => column !== draggedColumn);
  const targetIndex = withoutDraggedColumn.indexOf(targetColumn);

  if (targetIndex === -1) {
    return columns;
  }

  const insertionIndex = position === "after" ? targetIndex + 1 : targetIndex;

  return [
    ...withoutDraggedColumn.slice(0, insertionIndex),
    draggedColumn,
    ...withoutDraggedColumn.slice(insertionIndex),
  ];
}

function dropPositionFromEvent(event: DragEvent<HTMLTableCellElement>): DropPosition {
  const bounds = event.currentTarget.getBoundingClientRect();

  return event.clientX > bounds.left + bounds.width / 2 ? "after" : "before";
}

function stickyIdentityStyle(header: string, isHeader: boolean, orderedHeaders: string[]): CSSProperties | undefined {
  if (header === NAME_COLUMN) {
    return {
      backgroundColor: isHeader ? "#eaf7e8" : "#f1fbef",
      left: 0,
      minWidth: NAME_COLUMN_WIDTH,
      position: "sticky",
      top: isHeader ? 0 : undefined,
      width: NAME_COLUMN_WIDTH,
      zIndex: isHeader ? 60 : 20,
    };
  }

  if (header === LABEL_COLUMN) {
    return {
      backgroundColor: isHeader ? "#eaf7e8" : "#f1fbef",
      left: orderedHeaders.includes(NAME_COLUMN) ? NAME_COLUMN_WIDTH : 0,
      minWidth: LABEL_COLUMN_WIDTH,
      position: "sticky",
      top: isHeader ? 0 : undefined,
      width: LABEL_COLUMN_WIDTH,
      zIndex: isHeader ? 60 : 20,
    };
  }

  return undefined;
}

function columnBackgroundStyle(header: string, isHeader: boolean, orderedHeaders: string[]): CSSProperties | undefined {
  const stickyStyle = stickyIdentityStyle(header, isHeader, orderedHeaders);

  if (stickyStyle) {
    return stickyStyle;
  }

  if (header === PREDICTION_COLUMN) {
    return {
      backgroundColor: isHeader ? "#d8eaf3" : "#e7f6f8",
    };
  }

  return undefined;
}

function dietValueClassName(header: string, value: unknown) {
  if (!DIET_COLUMNS.includes(header)) {
    return "";
  }

  if (value === "carnivore") {
    return "font-bold text-[#d92d20]";
  }

  if (value === "herbivore") {
    return "font-bold text-[#0a7f38]";
  }

  return "";
}

function renderDefaultCellContent(header: string, value: unknown) {
  const formattedValue = formatTableCellValue(value);
  const className = dietValueClassName(header, formattedValue);

  return className ? <span className={className}>{formattedValue}</span> : formattedValue;
}

export function DataTable<TRow extends Record<string, unknown>>({
  headers,
  rows,
  sortConfig,
  onSort,
  getRowKey,
  getHeaderClassName,
  getHeaderButtonClassName,
  getCellClassName,
  renderHeaderAdornment,
  renderCell,
}: DataTableProps<TRow>) {
  const [orderedHeaders, setOrderedHeaders] = useState<string[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);

  const visibleHeaders = useMemo(
    () => reconcileColumnOrder(orderedHeaders, headers),
    [headers, orderedHeaders],
  );

  return (
    <table className="min-w-full border-collapse text-left text-[14px] leading-[1.35]">
      <thead className="sticky top-0 z-50 bg-[#f4f4f5] text-[#3f3f46]">
        <tr>
          {visibleHeaders.map((header, columnIndex) => {
            const isSortedColumn = sortConfig?.column === header;
            const isDropTarget = dragTarget?.column === header;
            const canDragColumn = !isLockedColumn(header);
            const dropRingClass =
              isDropTarget && dragTarget.position === "before"
                ? "shadow-[-3px_0_0_#71717a]"
                : isDropTarget
                  ? "shadow-[3px_0_0_#71717a]"
                  : "";

            return (
              <th
                key={header}
                className={`relative whitespace-nowrap border-b border-[#dedee0] px-[12px] py-[10px] font-semibold ${dropRingClass} ${
                  isLockedColumn(header) ? "shadow-[1px_0_0_#cfe5ca]" : ""
                } ${
                  getHeaderClassName?.(header, columnIndex, visibleHeaders) ?? ""
                }`}
                draggable={canDragColumn}
                style={columnBackgroundStyle(header, true, visibleHeaders)}
                onDragEnd={() => {
                  setDraggedColumn(null);
                  setDragTarget(null);
                }}
                onDragOver={(event) => {
                  if (canDragColumn && draggedColumn && draggedColumn !== header) {
                    event.preventDefault();
                    setDragTarget({ column: header, position: dropPositionFromEvent(event) });
                  }
                }}
                onDragStart={(event) => {
                  if (!canDragColumn) {
                    event.preventDefault();
                    return;
                  }

                  setDraggedColumn(header);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", header);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!canDragColumn) {
                    setDraggedColumn(null);
                    setDragTarget(null);
                    return;
                  }

                  const nextDraggedColumn = draggedColumn ?? event.dataTransfer.getData("text/plain");

                  if (nextDraggedColumn) {
                    const position = dropPositionFromEvent(event);
                    setOrderedHeaders((currentColumns) => {
                      const currentVisibleColumns = reconcileColumnOrder(currentColumns, headers);

                      return moveColumn(currentVisibleColumns, nextDraggedColumn, header, position);
                    });
                  }

                  setDraggedColumn(null);
                  setDragTarget(null);
                }}
              >
                <button
                  type="button"
                  className={`flex w-full cursor-pointer items-center gap-[6px] text-left font-semibold ${
                    getHeaderButtonClassName?.(header, columnIndex, visibleHeaders) ?? ""
                  }`}
                  title={canDragColumn ? "Cliquer pour trier, glisser pour déplacer la colonne" : "Cliquer pour trier"}
                  onClick={() => onSort(header)}
                >
                  {canDragColumn && (
                    <span className="cursor-grab text-[13px] leading-none text-[#a1a1aa]" aria-hidden="true">
                      ⋮⋮
                    </span>
                  )}
                  <span>{header}</span>
                  <span className="text-[11px] uppercase text-[#71717a]" aria-hidden="true">
                    {isSortedColumn ? (sortConfig.direction === "ascending" ? "asc" : "desc") : "↕"}
                  </span>
                </button>
                {renderHeaderAdornment?.(header, columnIndex, visibleHeaders)}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={getRowKey(row, rowIndex)} className="odd:bg-white even:bg-[#fafafa]">
            {visibleHeaders.map((header, columnIndex) => {
              const defaultContent = renderDefaultCellContent(header, row[header]);

              return (
                <td
                  key={header}
                  className={`whitespace-nowrap border-b border-[#ededf0] px-[12px] py-[9px] text-[#27272a] ${
                    isLockedColumn(header) ? "shadow-[1px_0_0_#d8ecd2]" : ""
                  } ${
                    getCellClassName?.(row, header, rowIndex, columnIndex, visibleHeaders) ?? ""
                  }`}
                  style={columnBackgroundStyle(header, false, visibleHeaders)}
                >
                  {renderCell ? renderCell(row, header, rowIndex, columnIndex, defaultContent) : defaultContent}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
