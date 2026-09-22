import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "ai-campus",
  brokers: ["localhost:9092"],
});

export const producer = kafka.producer();

export const consumer = kafka.consumer({
  groupId: "ai-campus-group",
});