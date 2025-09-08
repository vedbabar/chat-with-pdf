<div align="center">
<!-- TODO: Replace this with a real URL to a banner image you create -->
<!-- <img src="https://www.google.com/search?q=https://via.placeholder.com/800x200.png%3Ftext%3DDocuChat%2BAI%2BBanner" alt="DocuChat AI Banner" width="800"/> -->
<h1>Chat-with-PDF AI 📄🤖</h1>
<p>
<b>A secure, multi-user web application to upload PDFs and have AI-powered conversations about their content.</b>
</p>

<!-- ✅ FIX: Using standardized, small badges for a clean look -->

<p>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Next.js-000000%3Fstyle%3Dfor-the-badge%26logo%3Dnextdotjs%26logoColor%3Dwhite" alt="Next.js"/>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Node.js-339933%3Fstyle%3Dfor-the-badge%26logo%3Dnodedotjs%26logoColor%3Dwhite" alt="Node.js"/>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/PostgreSQL-316192%3Fstyle%3Dfor-the-badge%26logo%3Dpostgresql%26logoColor%3Dwhite" alt="PostgreSQL"/>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/TypeScript-007ACC%3Fstyle%3Dfor-the-badge%26logo%3Dtypescript%26logoColor%3Dwhite" alt="TypeScript"/>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Prisma-3982CE%3Fstyle%3Dfor-the-badge%26logo%3Dprisma%26logoColor%3Dwhite" alt="Prisma"/>
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Docker-2496ED%3Fstyle%3Dfor-the-badge%26logo%3Ddocker%26logoColor%3Dwhite" alt="Docker"/>
</p>
</div>

This full-stack project allows users to sign up, manage separate chat sessions, upload documents to each session, and get intelligent answers sourced directly from the document's content. It's built on a modern, robust tech stack designed for scalability and performance.

<br>
<div align="center">
<em>A preview of the DocuChat AI dashboard.</em><br><br>
<!-- TODO: Replace this with a real screenshot of your application -->
<img src="https://www.google.com/search?q=https://via.placeholder.com/800x450.png%3Ftext%3DYour%2BApp%2BScreenshot" alt="App Screenshot" width="800"/>
</div>

📚 Table of Contents
✨ Key Features

🛠️ Tech Stack & Architecture

🚀 Getting Started

Prerequisites

1. Clone the Repository

2. Set Up Environment Variables

3. Install Dependencies

4. Start the Databases with Docker

5. Run Database Migrations

6. Run the Application

🌟 Future Improvements

✨ Key Features
🔐 Secure User Authentication: Full sign-up, sign-in, and session management powered by Clerk.

📂 Multi-Chat Management: Users can create, rename, and delete multiple, isolated chat conversations.

⬆️ Per-Chat PDF Uploads: Upload PDF documents to specific chat sessions for organized knowledge bases.

🧠 AI-Powered Q&A (RAG): Leverages a Retrieval-Augmented Generation pipeline with Google's Gemini model to answer questions based on the uploaded documents.

🎯 Source-Specific Context: The AI is instructed to only use information from the documents within the active chat, ensuring no data leakage between conversations.

⏳ Background Processing: PDF parsing and embedding are handled by a robust background worker using BullMQ and Redis, keeping the UI fast and responsive.

💾 Vector Database: Uses Qdrant for efficient similarity searches to find the most relevant document context.

🎨 Polished & Responsive UI: A modern, three-panel interface with collapsible sidebars, dark mode, and loading states, built with Next.js, Tailwind CSS, and Shadcn/ui.

🛠️ Tech Stack & Architecture
This project uses a monorepo structure with a separate client and server.

Frontend (client)
Framework: Next.js (with App Router)

Language: TypeScript

UI: React, Tailwind CSS, Shadcn/ui

Authentication: Clerk

Backend (server)
Framework: Node.js with Express.js

Language: JavaScript (ESM)

Database ORM: Prisma

Background Jobs: BullMQ

Authentication: Clerk SDK

Databases & Services
Relational Database: PostgreSQL (for users, chats, files, messages)

Vector Database: Qdrant

Queue Management: Redis

AI & Embeddings: Google Gemini API & LangChain.js

🚀 Getting Started
Follow these instructions to set up and run the project locally.

Prerequisites
Node.js (v18 or later)

Git

Docker and Docker Compose

1. Clone the Repository
git clone [https://github.com/vedbabar/chat-with-pdf.git](https://github.com/vedbabar/chat-with-pdf.git)
cd chat-with-pdf

2. Set Up Environment Variables
You will need to create .env files for both the client and the server.

In the server folder, create a .env file:

# server/.env

# PostgreSQL Database Connection String
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Google AI API Key
GOOGLE_API_KEY="your_google_api_key"

# Qdrant URL
QDRANT_URL="http://localhost:6333"

# Clerk Keys
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

In the client folder, create a .env.local file:

# client/.env.local

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

You can get your API keys from the dashboards of Google AI Studio and Clerk.

3. Install Dependencies
Install the necessary packages for both the server and the client.

# In the root folder
npm install ./server
npm install ./client

4. Start the Databases with Docker
The easiest way to run PostgreSQL, Redis, and Qdrant is with Docker. A docker-compose.yml file is included.

# In the root folder, run:
docker-compose up -d

5. Run Database Migrations
With the database running, tell Prisma to create the necessary tables.

# In the server folder, run:
npx prisma migrate dev

6. Run the Application
You will need three separate terminals.

Terminal 1: Start the Backend Server

cd server
node index.js

Terminal 2: Start the Background Worker

cd server
node worker.js

Terminal 3: Start the Frontend Client

cd client
npm run dev

Your application should now be running! Open your browser to http://localhost:3000 to see it in action.

🌟 Future Improvements
Streaming Responses: Stream the AI's response token by token for a more interactive, real-time feel.

Individual File Deletion: Implement logic to delete a single file and its associated vectors from a chat.

PDF Highlighting: Use a library like react-pdf to display the PDF and highlight the source passages the AI used for its answer.

Support for More File Types: Extend the document loader to handle .docx, .txt, and other common file formats.
