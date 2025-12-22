'use client';

import { SignInButton } from '@clerk/nextjs';
import { BookOpen, Upload, MessageCircle, Sparkles, Zap, Shield, ArrowRight, CheckCircle, Star, FileText, Brain, Lock } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI understands context and provides accurate answers from your documents",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant responses with real-time streaming and smart document indexing",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your documents are encrypted and private. We never share your data",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: FileText,
      title: "Multi-Document Chat",
      description: "Upload multiple PDFs and ask questions across all your documents",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const steps = [
    { icon: Upload, title: "Upload PDF", description: "Drag and drop your documents" },
    { icon: MessageCircle, title: "Ask Questions", description: "Chat naturally with your PDFs" },
    { icon: Sparkles, title: "Get Insights", description: "Receive AI-powered answers instantly" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition"></div>
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Chat-with-PDF
            </span>
          </div>
          <SignInButton mode="modal">
            <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all">
              Sign In
            </button>
          </SignInButton>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Powered by Advanced AI</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Chat with Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              PDF Documents
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your PDFs into interactive conversations. Ask questions, get instant answers, and unlock insights from your documents with AI-powered intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignInButton mode="modal">
              <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl font-semibold text-lg transition-all">
              Watch Demo
            </button>
          </div>

          {/* Floating Elements */}
          <div className="relative mt-20 max-w-5xl mx-auto">
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    10K+
                  </div>
                  <div className="text-slate-400">Documents Analyzed</div>
                </div>
                <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    99.9%
                  </div>
                  <div className="text-slate-400">Accuracy Rate</div>
                </div>
                <div className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                    &lt;2s
                  </div>
                  <div className="text-slate-400">Average Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to make your documents interactive and insightful
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="group relative p-6 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                
                <div className={`relative inline-flex p-3 bg-gradient-to-br ${feature.gradient} rounded-xl mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 group-hover:bg-clip-text transition-all">
                  {feature.title}
                </h3>
                <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/4 left-full w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 -translate-x-1/2"></div>
                )}
                
                <div className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 text-center hover:border-slate-600 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                    {index + 1}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMCAxMmMyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6bTEyIDBjMi4yMSAwIDQgMS43OSA0IDRzLTEuNzkgNC00IDQtNC0xLjc5LTQtNCAxLjc5LTQgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already transforming their PDFs into interactive conversations
              </p>
              
              <SignInButton mode="modal">
                <button className="group px-10 py-5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                  Start Chatting Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              
              <p className="text-blue-100 mt-6 text-sm">
                No credit card required • Free to get started
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-slate-800/50 backdrop-blur-xl bg-slate-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Chat-with-PDF
            </span>
          </div>
          <p className="text-slate-400 mb-4">
            Transform your documents with AI-powered intelligence
          </p>
          <p className="text-sm text-slate-500">
            © 2025 Chat-with-PDF. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
