// index.js
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
import { QdrantClient } from "@qdrant/js-client-rest";
import cloudinary from "cloudinary"; // ⭐ ADDED
import streamifier from "streamifier"; // ⭐ ADDED

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// -------------------- CONFIG / CLIENTS --------------------
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const qdrantClient = new QdrantClient({ 
    url: process.env.QDRANT_URL || "http://localhost:6333",
    apiKey: process.env.QDRANT_API_KEY, 
});

// ⭐ CLOUDINARY CONFIG
cloudinary.v2.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use Upstash Redis (or any redis URL supported by bullmq)
const queue = new Queue("file-upload-queue", {
  connection: { 
    url: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL,
},
});

// -------------------- MULTER --------------------
// ⭐ CHANGE: Use memory storage for diskless deployment
const storage = multer.memoryStorage(); 

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// -------------------- EXPRESS --------------------
const app = express();
app.use(cors({
  origin: "*", // This allows ANY URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// -------------------- EMBEDDINGS --------------------
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "text-embedding-004",
});

// -------------------- AUTH --------------------
const clerkAuthMiddleware = ClerkExpressRequireAuth();

// -------------------- PROMPT (KEPT FOR COMPLETENESS) --------------------
const createEnhancedPrompt = (context, userQuery, chatHistory = []) => {
  const contextText = context.map(doc =>
    `📄 **Source**: ${doc.metadata?.source || 'Document'}
📍 **Page**: ${doc.metadata?.loc?.pageNumber || 'Unknown'}
📝 **Content**: ${doc.pageContent}`
  ).join('\n---\n');

  const historyText = chatHistory.slice(-6).map(msg =>
    `${msg.role.toUpperCase()}: ${msg.content}`
  ).join('\n');

  return `You are DocuChat, an expert document analysis assistant specializing in comprehensive PDF analysis.

**CORE INSTRUCTIONS:**
1. **Primary Focus**: Answer based PRIMARILY on the provided document context
2. **Citation Style**: Reference specific pages/sections when citing information
3. **Transparency**: If context lacks information, clearly state: "Based on the available document content, I don't have sufficient information about..."
4. **Conversational**: Maintain natural conversation flow using chat history
5. **Formatting**: Return responses in clean HTML with proper structure

**RESPONSE FORMAT:**
- Use <strong> tags for important headings and key terms
- Use <p> tags for paragraphs with proper spacing
- For lists, use: <div class="flex items-start gap-2 my-2"><span class="text-blue-500 mt-1">•</span><span>content</span></div>
- Highlight page references like: page 5, section 3, chapter 2
- Use professional, analytical tone

**DOCUMENT CONTEXT:**
${contextText}

${historyText ? `**RECENT CONVERSATION:**\n${historyText}\n` : ''}

**USER QUESTION:** ${userQuery}

**ANALYSIS INSTRUCTIONS:**
- Provide comprehensive analysis based on document content
- Cite specific sections/pages when referencing information  
- If making inferences, clearly distinguish between direct content and analysis
- Maintain focus on the document's actual content and themes
- Offer to clarify or elaborate on any points mentioned`;
};

// -------------------- ROUTES --------------------

// ---------- PUBLIC ROUTE ----------
app.get("/", (req, res) => {
  res.json({ status: "Chat-PDF API Server Running with Google AI!" });
});

// ---------- PROTECTED ROUTES MIDDLEWARE ----------
app.use(clerkAuthMiddleware);

// ---------- CREATE CHAT ----------
app.post("/chats", async (req, res) => {
  try {
    const { name } = req.body;
    const { userId } = req.auth;

    if (!userId) return res.status(401).json({ error: "User not authenticated." });

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

// ---------- LIST ALL CHATS ----------
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

// ---------- FILE UPLOAD (POST) ----------
app.post("/chats/:chatId/files", upload.single("pdf"), async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.auth;

        if (!chatId) return res.status(400).json({ error: "chatId is required" });
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        // ⭐ CLOUDINARY UPLOAD LOGIC
        const cloudinaryResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
                {
                    resource_type: 'raw', // Crucial for PDFs
                    folder: `docuchat/${userId}/${chatId}`,
                    public_id: `${Date.now()}-${req.file.originalname.replace(/\.pdf$/, '')}`,

                },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        const fileURL = cloudinaryResult.secure_url;
        const publicId = cloudinaryResult.public_id; // Store Public ID for deletion

        // Save file metadata in DB (storing URL in 'path')
        const fileRecord = await prisma.file.create({
            data: {
                filename: req.file.originalname,
                path: fileURL,
                chatId,
                status: "PROCESSING",
                publicId: publicId, 
            },
        });

        // Enqueue job for worker to process document
        await queue.add(
            "file-ready",
            JSON.stringify({
                fileId: fileRecord.id,
                chatId,
                url: fileURL, // Pass the URL to the worker
                chatId,
                publicId: publicId, 
            })
        );

        return res.json({ message: "uploaded", file: fileRecord });

    } catch (err) {
        console.error("❌ Upload error:", err);
        res.status(500).json({ error: `Upload failed: ${err.message}` });
    }
});

// ---------- GET FILES FOR CHAT ----------
app.get("/chats/:chatId/files", async (req, res) => {
    // ... (Logic remains the same)
    try {
        const { chatId } = req.params;
        const { userId } = req.auth;

        const chat = await prisma.chat.findFirst({ where: { id: chatId, userId } });
        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        const files = await prisma.file.findMany({
            where: { chatId },
            orderBy: { createdAt: "desc" },
        });

        res.json(files);
    } catch (err) {
        console.error("❌ Error fetching files:", err);
        res.status(500).json({ error: "Failed to fetch files" });
    }
});

// ---------- GET CHAT MESSAGES ----------
app.get("/chats/:id/messages", async (req, res) => {
    // ... (Logic remains the same)
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

// ---------- GET SPECIFIC CHAT DETAILS ----------
app.get("/chats/:id", async (req, res) => {
    // ... (Logic remains the same)
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

// ---------- UPDATE CHAT NAME ----------
app.patch("/chats/:chatId", async (req, res) => {
    // ... (Logic remains the same)
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

// ---------- DELETE CHAT ----------
app.delete("/chats/:chatId", async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.auth;

        const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: userId } });
        if (!chat) return res.status(404).json({ error: "Chat not found or access denied" });

        // ⭐ CLOUDINARY DELETE LOGIC
        const filesToDelete = await prisma.file.findMany({ where: { chatId } });
        for (const file of filesToDelete) {
            if (file.publicId) {
                try {
                    // Must specify resource_type: 'raw' for PDFs
                    await cloudinary.v2.uploader.destroy(file.publicId, { resource_type: 'raw' }); 
                    console.log(`🗑️ Deleted Cloudinary file: ${file.publicId}`);
                } catch (cloudErr) {
                    console.warn(`⚠️ Cloudinary delete warning for ${file.publicId}:`, cloudErr?.message || cloudErr);
                }
            }
        }
        // ⭐ END CLOUDINARY DELETE

        // Delete vectors in Qdrant that belong to this chat
        try {
            await qdrantClient.delete("langchainjs-testing", {
                filter: { must: [{ key: "metadata.chatId", match: { value: chatId } }] }
            });
        } catch (qErr) {
            console.warn("⚠️ Qdrant delete warning:", qErr?.message || qErr);
        }

        await prisma.message.deleteMany({ where: { chatId } });
        await prisma.file.deleteMany({ where: { chatId } });
        await prisma.chat.delete({ where: { id: chatId } });

        return res.json({ success: true, message: "Chat deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting chat:", err);
        return res.status(500).json({ error: "Failed to delete chat" });
    }
});

// ---------- CHAT (GET chat detail & RAG query) ----------
app.get("/chat", async (req, res) => {
    // ... (Logic remains the same, as it only uses embeddings)
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

        // Save user message
        await prisma.message.create({
            data: {
                chatId: String(chatId),
                role: "user",
                content: String(userQuery),
            },
        });

        // Get chat history
        const chatHistory = await prisma.message.findMany({
            where: { chatId: String(chatId) },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        // Vector search using QdrantVectorStore
        let vectorResults = [];
        try {
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddings,
                {
                    url: process.env.QDRANT_URL || "http://localhost:6333",
                    apiKey: process.env.QDRANT_API_KEY,
                    collectionName: "langchainjs-testing",
                }
            );

            const retriever = vectorStore.asRetriever({
                k: 5,
                filter: {
                    must: [{ key: "metadata.chatId", match: { value: String(chatId) } }]
                }
            });

            vectorResults = await retriever.invoke(userQuery);
            console.log(`📄 Found ${vectorResults.length} relevant documents`);
        } catch (vectorError) {
            console.error('❌ Vector search error:', vectorError);
        }

        // Prepare prompt and call Gemini
        const enhancedPrompt = createEnhancedPrompt(vectorResults, userQuery, chatHistory);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
            },
        });

        // Safe parse to avoid crashes when API returns unexpected structure
        const aiResponse =
            result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
            "⚠️ AI could not generate a response. Try again.";

        // Save assistant message
        await prisma.message.create({
            data: {
                chatId: String(chatId),
                role: "assistant",
                content: aiResponse,
                documents: vectorResults,
            },
        });

        return res.json({ message: aiResponse, docs: vectorResults });

    } catch (error) {
        console.error("❌ Chat error:", error);
        return res.status(500).json({ error: "Failed to process chat message" });
    }
});

// ---------- DOWNLOAD FILE (Now a Redirect) ----------
app.get('/files/:fileId/download', async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) return res.status(404).send('File not found');

        // ⭐ The 'path' field now holds the Cloudinary URL. Redirect for viewing/downloading.
        res.redirect(file.path);
    } catch (err) {
        console.error("❌ Download error:", err);
        res.status(500).send("Download failed");
    }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 8000;

// Only listen if NOT running on Vercel (for local dev)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server started on PORT: ${PORT}`);
  });
}

// Export the app for Vercel
export default app;
