import qdrant from "@/lib/qdrant";

export async function GET() {
  try {
    const collections = await qdrant.getCollections();

    return Response.json({
      message: "Qdrant connected successfully",
      collections: collections.collections,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        message: "Qdrant connection failed",
      },
      { status: 500 }
    );
  }
}