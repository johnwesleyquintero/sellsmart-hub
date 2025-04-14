export async function GET() {
  return new Response(JSON.stringify({ message: 'Resume endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
