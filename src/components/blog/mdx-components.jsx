var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
export const mdxComponents = {
    h1: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<h1 className={cn('mt-8 mb-4 text-3xl font-bold tracking-tight', className)} {...props}/>);
    },
    h2: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<h2 className={cn('mt-8 mb-4 text-2xl font-bold tracking-tight', className)} {...props}/>);
    },
    h3: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<h3 className={cn('mt-8 mb-4 text-xl font-bold tracking-tight', className)} {...props}/>);
    },
    h4: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<h4 className={cn('mt-8 mb-4 text-lg font-bold tracking-tight', className)} {...props}/>);
    },
    p: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<p className={cn('leading-7 mb-4', className)} {...props}/>);
    },
    ul: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<ul className={cn('my-6 ml-6 list-disc', className)} {...props}/>);
    },
    ol: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<ol className={cn('my-6 ml-6 list-decimal', className)} {...props}/>);
    },
    li: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<li className={cn('mt-2', className)} {...props}/>);
    },
    blockquote: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<blockquote className={cn('mt-6 border-l-2 border-primary pl-6 italic', className)} {...props}/>);
    },
    img: (_a) => {
        var { className, alt } = _a, props = __rest(_a, ["className", "alt"]);
        return (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={cn('rounded-md border', className)} alt={alt} {...props}/>);
    },
    hr: (_a) => {
        var props = __rest(_a, []);
        return (<hr className="my-8 border-muted-foreground/20" {...props}/>);
    },
    table: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<div className="my-6 w-full overflow-y-auto">
      <table className={cn('w-full', className)} {...props}/>
    </div>);
    },
    tr: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<tr className={cn('m-0 border-t p-0 even:bg-muted', className)} {...props}/>);
    },
    th: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<th className={cn('border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right', className)} {...props}/>);
    },
    td: (_a) => {
        var { className } = _a, props = __rest(_a, ["className"]);
        return (<td className={cn('border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right', className)} {...props}/>);
    },
    a: (_a) => {
        var { className, href = '#' } = _a, props = __rest(_a, ["className", "href"]);
        const isInternal = href.startsWith('/');
        if (isInternal) {
            return (<Link href={href} className={cn('font-medium underline underline-offset-4 text-primary', className)} {...props}/>);
        }
        return (<a href={href} className={cn('font-medium underline underline-offset-4 text-primary', className)} target="_blank" rel="noopener noreferrer" {...props}/>);
    },
    Image,
};
