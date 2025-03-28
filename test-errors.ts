// Syntax errors
const a: number = 'string';

// Type mismatches
function add(x: string, y: number) {
  return x + y;
}
add(5, '2');

// Missing modules

// Async function errors
async function fetchData(): string {
  const response = await fetch('https://api.example.com');
  return response.json();
}

// Undefined variables
console.log(undefinedVar);

// Configuration issues
declare module '*.css' {
  const content: any;
  export default content;
}