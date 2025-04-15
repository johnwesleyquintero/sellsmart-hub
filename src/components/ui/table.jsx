var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
import * as React from 'react';
import { cn } from '@/lib/utils';
const Table = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
});
Table.displayName = 'Table';
const TableHeader = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <thead
      ref={ref}
      className={cn(
        '[&_tr:last-child]:border-0 border-b bg-muted text-left',
        className,
      )}
      {...props}
    />
  );
});
TableHeader.displayName = 'TableHeader';
const TableBody = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <tbody
      ref={ref}
      className={cn(' [&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
});
TableBody.displayName = 'TableBody';
const TableFooter = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <tfoot
      ref={ref}
      className={cn(
        'bg-muted font-medium [&_tr:last-child]:border-0',
        className,
      )}
      {...props}
    />
  );
});
TableFooter.displayName = 'TableFooter';
const TableRow = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-accent/50 data-[state=selected]:bg-accent text-sm [&:has([data-state=selected])]:bg-accent/50',
        className,
      )}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';
const TableHead = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-muted-foreground font-medium [&:not([align=right])]:text-left [&:last-child]:text-right',
        className,
      )}
      {...props}
    />
  );
});
TableHead.displayName = 'TableHead';
const TableCell = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle [&:not([align=right])]:text-left [&:last-child]:text-right',
        className,
      )}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';
const TableCaption = React.forwardRef((_a, ref) => {
  var { className } = _a,
    props = __rest(_a, ['className']);
  return (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
TableCaption.displayName = 'TableCaption';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
