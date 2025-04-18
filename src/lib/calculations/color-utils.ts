export const getScoreColor = (score: number): string => {
  if (score < 50) return 'text-red-600';
  if (score < 70) return 'text-yellow-600';
  return 'text-green-600';
};
