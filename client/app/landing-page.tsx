'use client';

import { SignInButton } from '@clerk/nextjs';
import { BookOpen, Upload, MessageCircle, Zap, Shield, ArrowRight, FileText, Brain, Lock, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI understands context and provides accurate answers from your documents"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant responses with real-time streaming and smart document indexing"
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your documents are encrypted and private. We never share your data"
    },
    {
      icon: FileText,
      title: "Multi-Document Chat",
      description: "Upload multiple PDFs and ask questions across all your documents"
    }
  ];

  const steps = [
    { icon: Upload, title: "Upload PDF", description: "Drag and drop your documents" },
    { icon: MessageCircle, title: "Ask Questions", description: "Chat naturally with your PDFs" },
    { icon: CheckCircle, title: "Get Insights", description: "Receive AI-powered answers instantly" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 dark:bg-white">
              <BookOpen className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <span className="text-xl font-bold">Chat-with-PDF</span>
          </div>
          <SignInButton mode="modal">
            <button className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
              Sign In
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-24 pb-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">AI-Powered Document Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-slate-900 dark:text-white">
            Chat with Your PDF Documents
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto">
            Transform your PDFs into interactive conversations. Ask questions, get instant answers, and unlock insights from your documents.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton mode="modal">
              <button className="group px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
            <button className="px-8 py-4 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">10,000+</div>
                <div className="text-slate-600 dark:text-slate-400">Documents Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">99.9%</div>
                <div className="text-slate-600 dark:text-slate-400">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">&lt;2s</div>
                <div className="text-slate-600 dark:text-slate-400">Average Response</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed for professional document analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex p-3 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-slate-900 dark:text-white" />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-slate-200 dark:bg-slate-800 -translate-x-1/2"></div>
                )}
                
                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex p-4 bg-slate-900 dark:bg-white rounded-xl mb-6">
                    <step.icon className="h-8 w-8 text-white dark:text-slate-900" />
                  </div>
                  
                  <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center font-bold text-white dark:text-slate-900">
                    {index + 1}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 dark:bg-white rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-4 text-white dark:text-slate-900">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-300 dark:text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are transforming their document workflows
            </p>
            
            <SignInButton mode="modal">
              <button className="group px-10 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 mx-auto">
                Start Chatting Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
            
            <p className="text-slate-400 dark:text-slate-500 mt-6 text-sm">
              No credit card required • Free to get started
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-900 dark:bg-white">
              <BookOpen className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <span className="text-lg font-bold">Chat-with-PDF</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            AI-powered document intelligence
          </p>
          <p className="text-sm text-slate-500">
            © 2025 Chat-with-PDF. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
