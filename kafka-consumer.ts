import { consumer } from "./lib/kafka";

async function startConsumer() {
  await consumer.connect();

  await consumer.subscribe({
    topic: "complaints",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value?.toString();

      console.log("Kafka message received:");
      console.log(value);
    },
  });
}

startConsumer().catch(console.error);