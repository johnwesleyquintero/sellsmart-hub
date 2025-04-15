'use client';
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
const Progress = React.forwardRef((_a, ref) => {
  var { className, value, max = 100 } = _a,
    props = __rest(_a, ['className', 'value', 'max']);
  return (
    <progress
      ref={ref}
      className={cn(
        'h-2 w-full appearance-none overflow-hidden rounded-full bg-secondary',
        className,
      )}
      value={value}
      max={max}
      {...props}
    />
  );
});
Progress.displayName = 'Progress';
export { Progress };
