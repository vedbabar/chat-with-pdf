import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// --- INITIALIZATION ---
// Initialize clients once at the top level for reuse.
const prisma = new PrismaClient();
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "text-embedding-004",
});

// --- WORKER DEFINITION ---
const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(`📥 New Job ${job.id}: Processing...`, job.data);
    const { path: filePath, chatId, fileId } = JSON.parse(job.data);

    if (!filePath || !chatId || !fileId) {
      throw new Error("filePath, chatId, or fileId missing in job data");
    }

    try {
      // 1. Update file status to PROCESSING in the database
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "PROCESSING" },
      });

      // 2. Load the PDF document
      const normalizedPath = filePath.replace(/\\/g, "/");
      const loader = new PDFLoader(normalizedPath);
      const docs = await loader.load();
      console.log(`📄 Loaded ${docs.length} document chunks for file ${fileId}`);

      // 3. Add the necessary metadata to each chunk for filtering
      const docsWithMetadata = docs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chatId: chatId,
          fileId: fileId,
        },
      }));

      // 4. Create embeddings and upload to Qdrant vector store
      await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
        url: process.env.QDRANT_URL || "http://localhost:6333",
        collectionName: "langchainjs-testing",
      });
      console.log(`✅ Successfully embedded file ${fileId}`);

      // 5. Update file status to DONE in the database
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "DONE" },
      });
      console.log(`📊 Database status updated to DONE for file ${fileId}`);

    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
      // If any step fails, update the status to ERROR
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "ERROR" },
      });
      // Re-throw the error to mark the job as failed in BullMQ
      throw error;
    }
  },
  {
    concurrency: 5,
    connection: {
      host: "localhost",
      port: 6379,
    },
    // Keep a record of the last 100 completed and 50 failed jobs
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

// --- WORKER EVENT LISTENERS ---
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} has completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} has failed with error: ${err.message}`);
});

worker.on("error", (err) => {
  console.error("❌ A worker error has occurred:", err);
});

// --- GRACEFUL SHUTDOWN ---
const shutdown = async () => {
  console.log('🛑 Shutting down worker...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);  // Catches Ctrl+C
process.on('SIGTERM', shutdown); // Catches kill signals

console.log("🚀 Worker started and is waiting for jobs...");