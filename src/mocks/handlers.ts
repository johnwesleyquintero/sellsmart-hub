import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/connect', () => {
    // Respond with a mocked JSON response
    return HttpResponse.json({
      message: 'Mocked API response',
    });
  }),
];
