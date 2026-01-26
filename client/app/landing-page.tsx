'use client';

import { SignInButton } from '@clerk/nextjs';
import { Upload, MessageSquare, CheckCircle, ArrowRight, FileText } from 'lucide-react';

export default function LandingPage() {
  const steps = [
    { 
      number: "01", 
      title: "Upload", 
      description: "Drop your PDF document" 
    },
    { 
      number: "02", 
      title: "Ask", 
      description: "Type your questions naturally" 
    },
    { 
      number: "03", 
      title: "Answer", 
      description: "Get accurate responses instantly" 
    }
  ];

  return (
    <div className="min-h-screen bg-[#212121] text-white antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#171717]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#171717]" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">ChatPDF</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-white/60 hover:text-white transition-colors">
              How it works
            </a>
            <SignInButton mode="modal">
              <button className="text-sm px-4 py-2 bg-[#2f2f2f] text-white font-medium rounded-lg border border-white/10 hover:bg-[#3f3f3f] transition-colors">
                Sign in
              </button>
            </SignInButton>
          </div>

          <SignInButton mode="modal">
            <button className="md:hidden px-4 py-2 bg-white text-[#171717] text-sm font-medium rounded-lg">
              Get Started
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#2f2f2f] border border-white/10 rounded-full text-xs text-white/60 mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            AI-Powered Document Analysis
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            Chat with your PDFs
            <br />
            <span className="text-white/40">intelligently.</span>
          </h1>
          
          <p className="text-lg text-white/50 mb-10 max-w-lg mx-auto leading-relaxed">
            Upload any document, ask questions in plain English, and get accurate answers powered by AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SignInButton mode="modal">
              <button className="group w-full sm:w-auto px-6 py-3 bg-white text-[#171717] text-sm font-medium rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignInButton>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto px-6 py-3 text-sm text-white/60 font-medium rounded-lg bg-[#2f2f2f] border border-white/10 hover:bg-[#3f3f3f] transition-all text-center"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-white/40 uppercase tracking-widest">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-3">
              How it works
            </h2>
            <p className="text-white/50 mt-4 max-w-md mx-auto">
              Three simple steps to start chatting with your documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="group relative p-6 bg-[#2f2f2f]/50 border border-white/5 rounded-2xl hover:bg-[#2f2f2f] hover:border-white/10 transition-all">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-white/15 transition-colors">
                <Upload className="h-6 w-6 text-white/70" />
              </div>
              <div className="text-xs font-medium text-white/30 mb-2">Step 01</div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload PDF</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Drag and drop your document or click to browse. Supports any PDF file.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-white/10" />
            </div>

            {/* Step 2 */}
            <div className="group relative p-6 bg-[#2f2f2f]/50 border border-white/5 rounded-2xl hover:bg-[#2f2f2f] hover:border-white/10 transition-all">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-white/15 transition-colors">
                <MessageSquare className="h-6 w-6 text-white/70" />
              </div>
              <div className="text-xs font-medium text-white/30 mb-2">Step 02</div>
              <h3 className="text-lg font-semibold text-white mb-2">Ask Questions</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Type your questions in natural language. No special syntax needed.
              </p>
              {/* Connector line */}
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-white/10" />
            </div>

            {/* Step 3 */}
            <div className="group p-6 bg-[#2f2f2f]/50 border border-white/5 rounded-2xl hover:bg-[#2f2f2f] hover:border-white/10 transition-all">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-500/25 transition-colors">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-xs font-medium text-white/30 mb-2">Step 03</div>
              <h3 className="text-lg font-semibold text-white mb-2">Get Answers</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Receive accurate, context-aware responses with source citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/50 mb-8">
            No credit card required. Free to use.
          </p>
          <SignInButton mode="modal">
            <button className="group px-8 py-3.5 bg-white text-[#171717] text-sm font-medium rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2">
              Upload your first PDF
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/5 bg-[#171717]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <FileText className="h-3 w-3 text-[#171717]" />
            </div>
            <span className="text-sm font-medium">ChatPDF</span>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} ChatPDF. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
