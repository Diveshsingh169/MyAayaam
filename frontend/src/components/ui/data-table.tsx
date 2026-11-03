import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  tableClassName?: string;
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  className?: string;
};

export default function DataTable<T>({
  rows,
  columns,
  getRowKey,
  emptyMessage = "No records found.",
  className = "",
  tableClassName = "",
}: DataTableProps<T>) {
  return (
    <div className={["ui-data-table-wrap", className].filter(Boolean).join(" ")}>
      <table className={["ui-data-table", tableClassName].filter(Boolean).join(" ")}>
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col" className={column.className}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => <td key={column.key} className={column.className}>{column.render(row)}</td>)}
            </tr>
          )) : (
            <tr><td className="ui-data-table__empty" colSpan={columns.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
