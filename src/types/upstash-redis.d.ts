declare module '@upstash/redis' {
  interface Redis {
    constructor(options: { url: string; token: string });
  }
  const Redis: {
    new (options: { url: string; token: string }): Redis;
  };
  export { Redis };
}
