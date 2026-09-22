import qdrant from "@/lib/qdrant";

export async function POST() {
  try {
    const collectionName = "ai_campus_documents";

    const collections = await qdrant.getCollections();

    const exists = collections.collections.some(
      (collection) => collection.name === collectionName
    );

    if (!exists) {
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: 768,
          distance: "Cosine",
        },
      });
    }

    return Response.json({
      message: "Collection ready",
      collection: collectionName,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        message: "Collection creation failed",
      },
      { status: 500 }
    );
  }
}