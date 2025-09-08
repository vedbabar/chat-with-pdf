<h1>Chat with PDF AI</h1>

<p><strong>Chat with PDF AI</strong> is a secure, multi-user web application that allows you to upload PDFs and have AI-powered conversations about their content.</p>

<h2>Features</h2>
<ul>
  <li>🔐 <strong>Secure User Authentication</strong> – Full sign-up, sign-in, and session management powered by Clerk.</li>
  <li>💬 <strong>Multi-Chat Management</strong> – Create, rename, and delete multiple, isolated chat conversations.</li>
  <li>📄 <strong>Per-Chat PDF Uploads</strong> – Upload PDF documents to specific chat sessions.</li>
  <li>🤖 <strong>AI-Powered Q&amp;A</strong> – Uses Google’s Gemini model to answer questions based on document content.</li>
  <li>🛡 <strong>Source-Specific Context</strong> – Ensures no data leakage between different users' conversations.</li>
  <li>⚡ <strong>Background Processing</strong> – Handles PDF processing with a robust worker using BullMQ and Redis.</li>
  <li>🔍 <strong>Vector Search</strong> – Uses Qdrant for efficient similarity searches.</li>
  <li>🎨 <strong>Polished UI</strong> – Modern, responsive interface with dark mode, built with Next.js and Tailwind CSS.</li>
</ul>

<h2>Tech Stack</h2>
<ul>
  <li><strong>Frontend</strong>: Next.js, React, TypeScript, Tailwind CSS</li>
  <li><strong>Backend</strong>: Node.js, Express.js</li>
  <li><strong>Authentication</strong>: Clerk</li>
  <li><strong>Databases</strong>: PostgreSQL (Prisma), Qdrant (Vector Store), Redis, BullMQ (Queue)</li>
  <li><strong>AI</strong>: Google Gemini, LangChain.js</li>
</ul>

<h2>Installation</h2>

<p>Clone the repository:</p>
<pre><code>git clone https://github.com/vedbabar/chat-with-pdf.git
cd chat-with-pdf
</code></pre>

<h3>Set Up Environment Variables</h3>
<p>Create the following files and populate them with your API keys and database URLs:</p>
<ul>
  <li><code>.env</code> in the <code>server</code> directory</li>
  <li><code>.env.local</code> in the <code>client</code> directory</li>
</ul>

<h3>Install Dependencies</h3>
<pre><code># In the project's root folder
npm install ./server
npm install ./client
</code></pre>

<h3>Start Services with Docker</h3>
<p>This will start PostgreSQL, Redis, and Qdrant:</p>
<pre><code>docker-compose up -d
</code></pre>

<h3>Run Database Migration</h3>
<p>Inside the server folder, run:</p>
<pre><code>npx prisma migrate dev
</code></pre>

<h2>Usage</h2>

<p>To run the application, open three terminals:</p>
<ol>
  <li>
    <p><strong>Backend Server</strong></p>
    <pre><code>cd server
node index.js
</code></pre>
  </li>
  <li>
    <p><strong>Background Worker</strong></p>
    <pre><code>cd server
node worker.js
</code></pre>
  </li>
  <li>
    <p><strong>Frontend</strong></p>
    <pre><code>cd client
npm run dev
</code></pre>
  </li>
</ol>
<p>Your application should now be running! Open your browser to <a href="http://localhost:3000" target="_blank">http://localhost:3000</a> to see it in action.</p>
