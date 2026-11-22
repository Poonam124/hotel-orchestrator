import { Client, Connection } from "@temporalio/client";
import { env } from "../config/env";
import { retry } from "./retry";

export async function createTemporalClient() {
  const connection = await retry("Temporal", () =>
    Connection.connect({ address: env.TEMPORAL_ADDRESS, connectTimeout: "5s" })
  );
  const client = new Client({ connection, namespace: env.TEMPORAL_NAMESPACE });
  return { client, connection };
}
