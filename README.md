# DocuChat AI

## 1. Overview

DocuChat AI is a Retrieval-Augmented Generation (RAG) application designed to allow users to upload PDF documents and engage in conversational Q&A based solely on the content of those documents.

The architecture is split into a Next.js frontend, a secure Express API server, and a dedicated background worker process. This separation ensures that heavy, time-consuming tasks like document chunking and vector embedding are handled asynchronously, maintaining a responsive user experience.

**Key Features:**

*   Secure authentication via Clerk.
*   Asynchronous PDF processing and indexing using BullMQ and Qdrant.
*   Real-time chat interface with history management.
*   Source citation (page numbers) in AI responses.

## 2. Tech Stack

| Area | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js, React, Tailwind CSS | UI, Routing, State Management |
| **Authentication** | Clerk | User management, Session handling, Middleware protection |
| **Backend API** | Node.js, Express | Protected API endpoints, File upload handling (Multer) |
| **Database** | PostgreSQL, Prisma ORM | Persistent storage for chats, messages, and file metadata |
| **Vector Store** | Qdrant | High-performance vector indexing and retrieval |
| **LLM/Embeddings** | Google Generative AI (Gemini) | Conversational AI and document vectorization (`text-embedding-004`) |
| **Queue/Cache** | BullMQ, Valkey (Redis) | Asynchronous job queuing for file processing |
| **Infrastructure** | Docker, Docker Compose | Local environment orchestration |

## 3. Project Structure

| Directory/File | Role |
| :--- | :--- |
| `client/` | Next.js frontend application (UI, routing, state). |
| `client/app/` | Core application pages and components (Dashboard, Chat, Auth). |
| `server/` | Node.js/Express backend API and worker processes. |
| `server/index.js` | Main API server entry point, authentication, and file upload route. |
| `server/worker.js` | Dedicated BullMQ consumer for RAG pipeline execution (PDF loading, chunking, embedding). |
| `server/prisma/` | Database schema definitions and migrations. |
| `docker-compose.yml` | Defines and orchestrates Valkey (Redis) and Qdrant services. |

## 4. Key Components/Modules

### Client Components

*   **`client/app/page.tsx` (Dashboard):** The central state manager. Handles chat session CRUD (create, rename, load history) and integrates the `ChatComponent` and `FileUploadComponent`.
*   **`client/app/components/chat-sidebar.tsx`:** Renders the navigation list of all user conversations, managing active chat highlighting and new chat initiation.
*   **`client/app/components/chat.tsx`:** The core interactive chat interface. Handles message submission, API interaction, smooth scrolling, and formats AI responses using `cleanAssistantContent` (markdown to HTML, source highlighting).
*   **`client/app/components/file-upload.tsx`:** Manages document uploads (drag-and-drop), displays upload progress, and polls the backend to update file processing status (PENDING, PROCESSING, DONE).
*   **`client/app/components/skeletons.tsx`:** Centralized loading components (`MessageSkeleton`, `ChatListSkeleton`, etc.) to improve perceived performance.

### Server Components

*   **`server/index.js` (API):**
    *   Secures all routes using `ClerkExpressRequireAuth`.
    *   Handles `POST /chats/:chatId/files` by saving metadata and queuing the file for processing via BullMQ.
    *   Contains the RAG prompt engineering logic (`createEnhancedPrompt`) for the LLM.
*   **`server/worker.js` (RAG Pipeline):**
    *   Listens to the `"file-upload-queue"`.
    *   Uses `PDFLoader` and `GoogleGenerativeAIEmbeddings` to process documents.
    *   Stores vectorized chunks in `QdrantVectorStore`, tagged with `chatId` and `fileId` metadata.
    *   Updates the file status in the Prisma database upon completion or error.

## 5. Setup

### Prerequisites

1.  Node.js (v18+) and npm
2.  Docker and Docker Compose

### 1. Infrastructure Setup

Start the required services (Valkey/Redis for BullMQ and Qdrant for vector storage):

```bash
docker compose up -d
```

### 2. Database Setup

Ensure PostgreSQL is running (locally or via Docker). Configure your database connection string in the server environment variables.

Run Prisma migrations to set up the schema:

```bash
cd server
npm install
npx prisma migrate deploy
cd ..
```

### 3. Install Dependencies

Install dependencies for both the client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

## 6. Usage

### 1. Start the Server and Worker

The server handles API requests, and the worker handles asynchronous file processing.

```bash
# In one terminal, start the API server
cd server
npm run start

# In a second terminal, start the background worker
cd server
npm run worker
```

### 2. Start the Client

The Next.js client runs on port 3000 by default.

```bash
cd client
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## 7. Configuration

Configuration is managed via environment variables in `.env` files for both the `client` and `server` directories.

| Name | Purpose | Required | Default |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string for Prisma. | Yes | - |
| `GEMINI_API_KEY` | API key for Google Generative AI (LLM and Embeddings). | Yes | - |
| `CLERK_SECRET_KEY` | Clerk backend secret key for authentication. | Yes | - |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key. | Yes | - |
| `QDRANT_URL` | URL for the Qdrant vector database. | Yes | `http://localhost:6333` |
| `REDIS_URL` | Connection string for Valkey/Redis (used by BullMQ). | Yes | `redis://localhost:6379` |

## 8. Data Model

The application uses a PostgreSQL database managed by Prisma, centered around three core entities:

### `Chat`
Represents a single conversation session.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier. |
| `userId` | String | **Owner of the chat (Mandatory).** |
| `name` | String | User-editable chat name. |

### `Message`
Stores individual turns within a conversation.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier. |
| `chatId` | String | Foreign key to `Chat` (On Delete Cascade). |
| `role` | String | `user` or `system` (assistant). |
| `content` | String | Message text. |
| `documents` | JSONB | **Structured metadata for retrieved sources/citations.** |

### `File`
Tracks uploaded documents associated with a chat.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique identifier. |
| `chatId` | String | Foreign key to `Chat` (On Delete Cascade). |
| `filename` | String | Original name of the file. |
| `path` | String | Storage location on the server disk. |
| `status` | Text | **Processing state:** `PENDING` (default), `PROCESSING`, `DONE`, `ERROR`. |

## 10. Deployment

The application is structured for a distributed deployment:

1.  **Infrastructure:** Qdrant and Valkey/Redis should be deployed as managed services or dedicated containers.
2.  **API Server (`server/index.js`):** A standard Node.js environment (e.g., a cloud function or container) handling HTTP traffic.
3.  **Worker Process (`server/worker.js`):** A long-running, dedicated process that only consumes jobs from the BullMQ queue. This should be scaled independently based on expected file upload volume.
4.  **Client (`client/`):** A Next.js application, ideally deployed to a platform like Vercel or a custom Node server.

The `docker-compose.yml` file provides a robust blueprint for setting up the required services in a local development or staging environment.
