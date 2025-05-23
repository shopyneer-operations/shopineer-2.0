import { useMemo } from "react";
import { Table as UiTable } from "@medusajs/ui";
import { get } from "lodash";

type Column = {
  key: string;
  label?: string;
  render?: (row: any) => React.ReactNode;
};

export type TableProps = {
  columns: Column[];
  data: Record<string, any>[];
  pageSize: number;
  count: number;
  currentPage: number;
  setCurrentPage: (value: number) => void;
};

export function Table({ columns, data, pageSize, count, currentPage, setCurrentPage }: TableProps) {
  const pageCount = useMemo(() => {
    return Math.ceil(count / pageSize);
  }, [count, pageSize]);

  const canNextPage = useMemo(() => {
    return currentPage < pageCount - 1;
  }, [currentPage, pageCount]);
  const canPreviousPage = useMemo(() => {
    return currentPage - 1 >= 0;
  }, [currentPage]);

  const nextPage = () => {
    if (canNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (canPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  function getCellContent(item: Record<string, any>, column: Column) {
    if (column.render) {
      return column.render(item) || "_";
    }

    return get(item, column.key) || "_";
  }

  return (
    <div className="flex h-full flex-col overflow-hidden !border-t-0">
      <UiTable>
        <UiTable.Header>
          <UiTable.Row>
            {columns.map((column, index) => (
              <UiTable.HeaderCell key={index}>{column.label || column.key}</UiTable.HeaderCell>
            ))}
          </UiTable.Row>
        </UiTable.Header>
        <UiTable.Body>
          {data.map((item, index) => {
            const rowIndex = "id" in item ? (item.id as string) : index;
            return (
              <UiTable.Row key={rowIndex}>
                {columns.map((column, index) => (
                  <UiTable.Cell key={`${rowIndex}-${index}`}>{getCellContent(item, column)}</UiTable.Cell>
                ))}
              </UiTable.Row>
            );
          })}
        </UiTable.Body>
      </UiTable>
      <UiTable.Pagination
        count={count}
        pageSize={pageSize}
        pageIndex={currentPage}
        pageCount={pageCount}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        previousPage={previousPage}
        nextPage={nextPage}
      />
    </div>
  );
}
