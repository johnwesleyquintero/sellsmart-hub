import { z } from "zod";

export const configSchema = z.object({
  env: z.enum(["development", "staging", "production", "test"]),
  edgeConfig: z.object({
    url: z.string().url(),
  }),
  blobStorage: z.object({
    readWriteToken: z.string().url(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const config: Config = {
  env: (process.env.NODE_ENV as Config["env"]) || "development",
  edgeConfig: {
    url: process.env.EDGE_CONFIG as string,
  },
  blobStorage: {
    readWriteToken: process.env.BLOB_READ_WRITE_TOKEN as string,
  },
};

// Validate configuration at runtime
try {
  configSchema.parse(config);
} catch (error) {
  console.error("Invalid configuration:", error);
  throw error;
}

export default config;
