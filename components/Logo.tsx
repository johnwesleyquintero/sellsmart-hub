export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 32 32" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Add your SVG path data here */}
      <path 
        d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" 
        fill="currentColor"
      />
    </svg>
  );
}
