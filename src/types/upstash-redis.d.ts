declare module '@upstash/redis' {
  interface Redis {
    pipeline(): {
      hincrby(key: string, field: string, increment: number): this;
      expire(key: string, seconds: number): this;
      exec<T = unknown[]>(): Promise<T>;
    };
    ping(): Promise<string>;
    hincrby(key: string, field: string, increment: number): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    eval<T = unknown>(
      script: string,
      keys: string[],
      args: (string | number)[],
    ): Promise<T>;
    constructor(options: { url: string; token: string });
  }
  const Redis: {
    new (options: { url: string; token: string }): Redis;
  };
  export { Redis };
}
