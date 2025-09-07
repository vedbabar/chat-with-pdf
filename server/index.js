import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import pkg from "@prisma/client";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import path from 'path';
import { fileURLToPath } from 'url';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const queue = new Queue("file-upload-queue", {
  connection: { host: `localhost`, port: "6379" },
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();
app.use(cors());
app.use(express.json());

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "text-embedding-004",
});

const clerkAuthMiddleware = ClerkExpressRequireAuth();

const createEnhancedPrompt = (context, userQuery, chatHistory = []) => {
  const contextText = context.map(doc => `
Source: ${doc.metadata?.source || 'Document'}
Page: ${doc.metadata?.loc?.pageNumber || 'Unknown'}
Content: ${doc.pageContent}
`).join('\n---\n');

  const historyText = chatHistory.slice(-6).map(msg => 
    `${msg.role.toUpperCase()}: ${msg.content}`
  ).join('\n');

  return `You are DocuChat, an expert document analysis assistant.

INSTRUCTIONS:
1. Answer based PRIMARILY on the provided context from the PDF document.
2. Be specific and cite relevant sections when possible.
3. If the context doesn't contain enough information, clearly state this.
4. Maintain conversation continuity using the chat history.
5. Return all output in HTML format with proper formatting.
6. Use <b> or <strong> for headings, <p> for paragraphs.
7. Use a normal hyphen (-) for bullet points — do NOT use <ul> or <li>.

DOCUMENT CONTEXT:
${contextText}

${historyText ? `RECENT CONVERSATION HISTORY:\n${historyText}\n` : ''}

CURRENT USER QUESTION: ${userQuery}

Please provide a comprehensive answer based on the document context. If you reference specific information, mention which part of the document it comes from.`;
};

// --- Public Route ---
app.get("/", (req, res) => {
  res.json({ status: "Chat-PDF API Server Running with Google AI!" });
});

// --- Protected Routes ---
app.use(clerkAuthMiddleware);

// app.post("/chats/:chatId/files", async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const { userId } = req.auth;

//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     const chat = await prisma.chat.findUnique({ where: { id: chatId } });
//     if (!chat || chat.userId !== userId) {
//       return res.status(404).json({ error: "Chat not found or access denied" });
//     }

//     const fileRecord = await prisma.file.create({
//       data: {
//         filename: req.file.originalname,
//         path: req.file.path,
//         chatId,
//       },
//     });

//     await queue.add("file-ready", JSON.stringify({
//         fileId: fileRecord.id,
//         path: req.file.path,
//         chatId,
//         filename: req.file.originalname, 
//     }));

//     return res.json({
//       message: "File uploaded successfully and sent for processing.",
//       file: fileRecord,
//     });
//   } catch (error) {
//     console.error("❌ Upload error:", error);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });
app.post("/chats/:chatId/files", upload.single("pdf"), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Ensure chat belongs to user
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found or access denied" });
    }

    // Save file info in DB
    const fileRecord = await prisma.file.create({
      data: {
        filename: req.file.originalname,
        path: req.file.path,
        chatId,
        status: "PROCESSING",
      },
    });

    // Add to queue if you’re processing it later
    await queue.add(
      "file-ready",
      JSON.stringify({
        fileId: fileRecord.id,
        filename: req.file.originalname,
        source: req.file.destination,
        path: req.file.path,
        chatId,
      })
    );

    return res.json({
      message: "uploaded",
      file: fileRecord,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});



app.get('/files/:fileId/download', async (req, res) => {
  const { fileId } = req.params;
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return res.status(404).send('File not found');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  res.sendFile(path.resolve(__dirname, file.path));
});



// Chat endpoint, ensuring user ownership
app.get("/chat", async (req, res) => {
  try {
    const { userId } = req.auth;
    console.log("🔍 Incoming query:", req.query);
    const { message: userQuery, chatId } = req.query;
    
    if (!chatId) return res.status(400).json({ error: "chatId is required" });
    if (!userQuery) return res.status(400).json({ error: "message is required" });

    const chat = await prisma.chat.findUnique({ where: { id: String(chatId) } });
    if (!chat || chat.userId !== userId) {
      return res.status(404).json({ error: "Chat not found or access denied" });
    }

    // ✅ FIX: Provide the correct data to save the user's message
    const userMsg = await prisma.message.create({
        data: {
            chatId: String(chatId),
            role: "user",
            content: String(userQuery),
        },
    });

    // ✅ FIX: Provide the correct data to get the chat history
    const chatHistory = await prisma.message.findMany({
        where: { chatId: String(chatId) },
        orderBy: { createdAt: 'asc' },
        take: 10
    });

    let vectorResults = [];
    try {
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings, { 
                url: process.env.QDRANT_URL || "http://localhost:6333",
                collectionName: "langchainjs-testing",
            }
        );
        const retriever = vectorStore.asRetriever({
            k: 3,
            filter: {
                must: [{ key: "metadata.chatId", match: { value: String(chatId) } }]
            }
        });
        vectorResults = await retriever.invoke(userQuery);
        console.log(`📄 Found ${vectorResults.length} relevant documents`);
    } catch (vectorError) {
        console.error('❌ Vector search error:', vectorError);
    }

    const enhancedPrompt = createEnhancedPrompt(vectorResults, userQuery, chatHistory);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // ✅ FIX: Provide the correct data for generating content
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
        },
    });
    const aiResponse = result.response.candidates[0].content.parts[0].text;

    // ✅ FIX: Provide the correct data to save the AI's response
    const aiMsg = await prisma.message.create({
        data: {
            chatId: String(chatId),
            role: "assistant",
            content: aiResponse,
            documents: vectorResults, // Save sources
        },
    });

    return res.json({ message: aiResponse, docs: vectorResults });
  } catch (error) {
    console.error("❌ Chat error:", error);
    return res.status(500).json({ error: "Failed to process chat message" });
  }
});

// Create a new chat for the authenticated user
app.post("/chats", async (req, res) => {
  try {
    const { name } = req.body;
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    const chat = await prisma.chat.create({
      data: {
        name: name || "New Chat",
        userId: userId,
      }
    });
    res.json(chat);
  } catch (err) {
    console.error("❌ Error creating chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all chats for the authenticated user
app.get("/chats", async (req, res) => {
  try {
    const { userId } = req.auth;
    const chats = await prisma.chat.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        files: true
      }
    });
    res.json(chats);
  } catch (err) {
    console.error("❌ Error fetching chats:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a chat, ensuring user ownership
app.delete("/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;

    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: userId } });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

    // Clean up associated data from Qdrant
    // Note: This requires the Qdrant client
    // const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL });
    // await qdrantClient.delete("langchainjs-testing", {
    //     filter: { must: [{ key: "metadata.chatId", match: { value: chatId } }] }
    // });
    
    await prisma.message.deleteMany({ where: { chatId } });
    await prisma.file.deleteMany({ where: { chatId } });
    await prisma.chat.delete({ where: { id: chatId } });

    return res.json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting chat:", err);
    return res.status(500).json({ error: "Failed to delete chat" });
  }
});

// Update chat name, ensuring user ownership
app.patch("/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name } = req.body;
    const { userId } = req.auth;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const updatedChat = await prisma.chat.updateMany({
      where: { id: chatId, userId: userId },
      data: { name },
    });

    if (updatedChat.count === 0) {
        return res.status(404).json({ error: "Chat not found or access denied" });
    }

    res.json({ id: chatId, name });
  } catch (err) {
    console.error("❌ Error updating chat:", err);
    res.status(500).json({ error: "Failed to rename chat" });
  }
});

// Get chat messages, ensuring user ownership
app.get("/chats/:id/messages", async (req, res) => {
  try {
    const chatId = req.params.id;
    const { userId } = req.auth;

    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: userId } });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get a specific chat, ensuring user ownership
app.get("/chats/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.auth;

    const chat = await prisma.chat.findFirst({
      where: { id, userId },
      include: { 
        messages: { orderBy: { createdAt: 'asc' } },
        files: true
      },
    });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });
    res.json(chat);
  } catch (err) {
    console.error("❌ Error fetching chat:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get files for a chat, ensuring user ownership
app.post("/chats/:chatId/files", upload.single("pdf"), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;

    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: userId } });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });
    
    const files = await prisma.file.findMany({ 
      where: { chatId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

app.get("/chats/:chatId/files", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.auth;

    // Ensure chat belongs to user
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
    if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

    const files = await prisma.file.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching files:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on PORT: ${PORT}`);
});



