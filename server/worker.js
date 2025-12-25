// worker.js
import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PrismaClient } from "@prisma/client";
import http from 'http';
import "dotenv/config";
import fs from "fs/promises";
import path from "path"; 
import axios from "axios";
import os from "os"; 

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Worker is running!');
});
server.listen(process.env.PORT || 10000);
console.log("Dummy server listening for Render...");

// -------------------- INITIALIZATION --------------------
const prisma = new PrismaClient();

const GEMINI_EMBEDDING_SIZE = 3072;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION_NAME || "langchainjs-testing";
const REDIS_CONNECTION_URL = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-embedding-001",
});

// -------------------- WORKER --------------------
const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(` New Job ${job.id}: Processing...`, job.data);

    const { url, chatId, fileId } = JSON.parse(job.data);

    if (!url || !chatId || !fileId) {
      throw new Error("url, chatId, or fileId missing in job data");
    }

    let tempFilePath = ''; 

    try {
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "PROCESSING" }, // redundant operation for now, but can be used for showing status "QUEUED" later(not implemented for now)
      });

      const response = await axios.get(url, {
          responseType: 'arraybuffer', 
          maxContentLength: Infinity,
      });

      // Create a secure temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `docuchat_${fileId}_${Date.now()}.pdf`);
      await fs.writeFile(tempFilePath, response.data);
      console.log(` File downloaded to temporary path: ${tempFilePath}`);
      
      // 3️ Load PDF (using the tempFilePath)
      const normalizedPath = tempFilePath.replace(/\\/g, "/");
      const loader = new PDFLoader(normalizedPath);
      const docs = await loader.load();
      
      // 4️ Split documents into smaller chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.splitDocuments(docs);
      console.log(` Loaded and split into ${splitDocs.length} chunks for file ${fileId}`);

      // 5️ Add metadata
      const docsWithMetadata = splitDocs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          chatId,
          fileId,
        },
      }));

      // 6️ Upload vectors
      await QdrantVectorStore.fromDocuments(docsWithMetadata, embeddings, {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        collectionName: QDRANT_COLLECTION,

        collectionConfig: {
          vectors: {
            size: GEMINI_EMBEDDING_SIZE, 
            distance: "Cosine",
          },
          params: {
            indexed: [
              { field_name: "metadata.chatId", field_type: "keyword" },
              { field_name: "metadata.fileId", field_type: "keyword" }
            ],
          },
        }
      });

      console.log(` Successfully embedded file ${fileId}`);

      // 7️ Mark file as DONE
      await prisma.file.update({
        where: { id: fileId },
        data: { status: "DONE" },
      });
      console.log(` Status updated to DONE for file ${fileId}`);

    } catch (error) {
      console.error(` Error in job ${job.id}:`, error);

      await prisma.file.update({
        where: { id: fileId },
        data: { status: "ERROR" },
      });

      throw error;
    } finally {
        // CLEANUP: Delete temporary file regardless of success or failure
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
                console.log(` Cleaned up temporary file: ${tempFilePath}`);
            } catch (cleanupError) {
                console.warn(` Failed to clean up temp file ${tempFilePath}:`, cleanupError.message);
            }
        }
    }
  },
  {
    concurrency: 5,
    connection: {
      url: REDIS_CONNECTION_URL, 
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  }
);

// -------------------- WORKER EVENTS --------------------
worker.on("completed", (job) => {
  console.log(` Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(` Job ${job.id} failed: ${err.message}`);
});

worker.on("error", (err) => {
  console.error(" Worker error:", err);
});

console.log(" Worker started and connected to Redis...");
