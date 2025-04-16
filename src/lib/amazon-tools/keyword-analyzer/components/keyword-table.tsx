'use client';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDownUp, Columns } from 'lucide-react';
// import { useState, useRef } from 'react';
// import { SampleCsvButton } from './sample-csv-button';
// import { Upload } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { useState } from 'react';
// import { AlertCircle } from 'lucide-react';
// import { error } from 'console';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function KeywordTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // const handleExport = () => {};
  // const clearData = () => {};

  return (
    <div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter keywords..."
          value={
            (table.getColumn('keywords')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table
              .getColumn('keywords')
              ?.setFilterValue((event.target as HTMLInputElement).value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Columns className="mr-2 h-4 w-4" /> Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value);
                      }}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanSort() ? (
                        <button
                          className="ml-2"
                          onClick={() => {
                            table.setSorting(
                              header.column.getSortIndex() === 0
                                ? [
                                    {
                                      id: header.column.id,
                                      desc: false,
                                    },
                                  ]
                                : [],
                            );
                          }}
                        >
                          <ArrowDownUp className="h-4 w-4" />
                        </button>
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <button
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <button
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
