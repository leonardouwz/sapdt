import { env } from "@/config/env";
import { createHttpServices } from "./http/HttpApis";
import { createMockServices } from "./mock/MockApis";
import type { Services } from "./ports";

export function createServices(): Services {
  return env.dataSource === "http" ? createHttpServices(env.apiBaseUrl) : createMockServices();
}
