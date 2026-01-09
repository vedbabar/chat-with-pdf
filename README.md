# Chat-with-PDF: AI-Powered Document Assistant

## 1. Overview

**Chat-with-PDF** is a full-stack application designed to allow users to upload PDF documents and engage in intelligent, context-aware conversations with the content using Retrieval-Augmented Generation (RAG).

The application provides a secure, authenticated environment where users can manage multiple chat sessions, upload files via drag-and-drop, track file processing status in real-time, and receive AI responses that cite specific document sources.

## 2. Tech Stack

| Area | Technology | Key Components |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router), React, TypeScript | Clerk (Auth), Shadcn UI, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript | Clerk (Auth), Prisma (ORM), CORS, Multer |
| **Database** | PostgreSQL | Prisma Migrations |
| **AI/RAG** | Google Generative AI (Gemini), LangChain | Embeddings, Prompt Engineering, SSE Streaming |
| **Vector DB** | Qdrant | Vector Storage, Metadata Filtering |
| **Queue/Worker** | BullMQ, Valkey (Redis) | Asynchronous PDF Processing, Chunking, Indexing |
| **File Storage** | Cloudinary | External File Hosting |

## 3. Project Structure

| Path | Role |
| :--- | :--- |
| `client/` | Frontend Next.js application (UI, Auth, API interaction). |
| `client/app/` | Core application pages, layouts, and components. |
| `client/components/` | Reusable UI components (e.g., `ui/button.tsx`). |
| `server/` | Backend Express API server, handling routing, auth, and file uploads. |
| `server/worker.js` | Dedicated worker process for heavy RAG pipeline tasks (chunking, embedding). |
| `server/prisma/` | Database schema definitions and migration history. |
| `docker-compose.yml` | Defines local infrastructure (Valkey, Qdrant). |

## 4. Key Components/Modules

### Frontend Components

| Component | Description |
| :--- | :--- |
| `ChatComponent` | Core chat interface. Manages state, handles real-time SSE streaming of AI responses, and displays cited document references. Uses `cleanAssistantContent` for markdown formatting. |
| `FileUploadComponent` | Manages document ingestion. Handles drag-and-drop, secure authenticated uploads, and implements real-time polling to track server-side processing status (PENDING, PROCESSING, DONE). |
| `PdfViewerModal` | Utility component using an `iframe` (via Google Docs Viewer) to securely display uploaded PDF files. |
| `skeletons.tsx` | Provides loading states (`MessageSkeleton`, `FileUploadSkeleton`) to enhance perceived performance. |
| `layout.tsx` | Root layout and primary authentication gate, rendering the `LandingPage` for unauthenticated users. |

### Backend Services

| Service | Description |
| :--- | :--- |
| `server/index.js` | API entry point. Initializes Express, sets up Clerk authentication, configures Multer for PDF uploads, and exposes chat management endpoints (`/chats`). Sets up the BullMQ queue for processing. |
| `server/worker.js` | Asynchronous RAG processor. Downloads PDFs, uses LangChain's `PDFLoader` and `RecursiveCharacterTextSplitter`, generates embeddings via Google AI, and indexes chunks into Qdrant, updating file status in Prisma. |
| **Middleware** (`client/middleware.ts`) | Global Next.js middleware enforcing authentication on all protected routes (`/dashboard`, `/chat`). |

## 5. Setup

### Prerequisites

*   Node.js (v18+)
*   Docker and Docker Compose
*   PostgreSQL database instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd chat-with-pdf
    ```

2.  **Start Infrastructure:**
    Use Docker Compose to launch the required services (Valkey for BullMQ, Qdrant for vector storage).
    ```bash
    docker compose up -d
    ```

3.  **Install Dependencies:**
    Install dependencies for both the client and server.
    ```bash
    # Client (Frontend)
    cd client
    npm install
    
    # Server (Backend)
    cd ../server
    npm install
    ```

4.  **Database Setup:**
    Ensure your PostgreSQL connection string is set in the server's `.env` file. Run the Prisma migrations to set up the schema:
    ```bash
    # From the server/ directory
    npx prisma migrate deploy
    ```

## 6. Usage

### Running the Application

1.  **Start the Server API:**
    ```bash
    # From the server/ directory
    npm run dev
    ```

2.  **Start the Worker Process:**
    The worker must run separately to handle file processing jobs.
    ```bash
    # From the server/ directory
    npm run worker
    ```

3.  **Start the Client:**
    ```bash
    # From the client/ directory
    npm run dev
    ```

The application will be accessible at `http://localhost:3000`.

### Quickstart API Endpoints (Authenticated)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chats` | Create a new chat session. |
| `GET` | `/chats` | Retrieve a list of all chat sessions for the authenticated user. |
| `GET` | `/chats/{chatId}/files` | Fetch the list of files associated with a specific chat. |
| `POST` | `/chats/{chatId}/files` | Upload a PDF file (max 10MB) to the specified chat. |
| `GET` | `/chat?chatId={id}&query={q}` | **Stream** a real-time AI response (SSE) for a query. |

## 7. Configuration

Configuration is managed via environment variables in the respective `.env` files for the client and server.

| Name | Purpose | Required | Default |
| :--- | :--- | :--- | :--- |
| `CLERK_SECRET_KEY` | Clerk API secret for backend authentication. | Yes | - |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for frontend authentication. | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string for Prisma. | Yes | - |
| `QDRANT_URL` | URL for the Qdrant vector database. | Yes | `http://localhost:6333` |
| `REDIS_URL` | Connection string for Valkey/Redis (BullMQ). | Yes | `redis://localhost:6379` |
| `GEMINI_API_KEY` | Google AI API key for LLM and Embeddings. | Yes | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name for file hosting. | Yes | - |
| `API_BASE_URL` | Base URL for the backend API server. | Yes | `http://localhost:8080` |

## 8. Data Model

The application uses a PostgreSQL database managed by Prisma.

### Entities and Relations

| Entity | Description | Key Fields | Relations |
| :--- | :--- | :--- | :--- |
| **Chat** | Root entity for a conversation thread. | `id`, `name`, `userId` (NOT NULL) | Has many `Message`, Has many `File` |
| **Message** | Individual entry in a chat history. | `id`, `chatId`, `role`, `content`, `documents` (JSONB) | Belongs to `Chat` |
| **File** | Metadata for an uploaded document. | `id`, `chatId`, `filename`, `status` (PENDING/PROCESSING/DONE/ERROR), `publicId` | Belongs to `Chat` |

**Key Schema Constraints:**
*   `Chat.userId` ensures every chat is owned by an authenticated user.
*   `File.status` tracks the asynchronous RAG processing pipeline.
*   `ON DELETE CASCADE` ensures messages and files are deleted when the parent `Chat` is removed.

## 10. Deployment

The application is designed for a distributed deployment environment:

*   **Client:** Deployed as a Next.js application (e.g., Vercel, Netlify).
*   **Server:** Deployed as a Node.js Express service (e.g., Render, AWS EC2).
*   **Worker:** Deployed as a separate, long-running Node.js process, often requiring higher memory/CPU (e.g., Render Background Worker, Kubernetes Job).
*   **Infrastructure:** Requires managed services for PostgreSQL, Qdrant, and Valkey/Redis (or self-hosted Docker containers).

The `server/worker.js` includes a basic HTTP health check on port `10000` for monitoring in production environments.
