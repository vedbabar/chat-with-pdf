// 'use client';

// import * as React from 'react';
// import { Bot, User, FileText } from 'lucide-react';

// // Skeleton component for individual message bubbles
// export const MessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => (
//   <div className={`flex gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
//     {!isUser && (
//       <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-2 h-fit animate-pulse">
//         <Bot className="h-5 w-5 text-slate-400" />
//       </div>
//     )}
//     <div className={`max-w-3xl ${isUser ? 'order-2' : ''}`}>
//       <div className={`rounded-2xl px-4 py-3 shadow-sm ${
//         isUser 
//           ? 'bg-slate-200 dark:bg-slate-700' 
//           : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
//       }`}>
//         {/* Message content skeleton */}
//         <div className="space-y-2">
//           <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
//           <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
//           {!isUser && <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>}
//         </div>
//       </div>
//       {/* Document sources skeleton for assistant messages */}
//       {!isUser && (
//         <div className="mt-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
//           <div className="px-4 py-3 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <FileText className="h-4 w-4 text-slate-400" />
//               <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20"></div>
//             </div>
//             <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
//           </div>
//         </div>
//       )}
//     </div>
//     {isUser && (
//       <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-2 h-fit animate-pulse">
//         <User className="h-5 w-5 text-slate-400" />
//       </div>
//     )}
//   </div>
// );

// // Skeleton for the chat messages container
// export const ChatMessagesSkeleton: React.FC = () => (
//   <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
//     <MessageSkeleton isUser={true} />
//     <MessageSkeleton isUser={false} />
//     <MessageSkeleton isUser={true} />
//     <MessageSkeleton isUser={false} />
//   </div>
// );

// // Skeleton for chat list in sidebar
// export const ChatListSkeleton: React.FC = () => (
//   <div className="flex-1 overflow-y-auto">
//     {[...Array(6)].map((_, index) => (
//       <div key={index} className="m-2 rounded-lg border border-transparent p-3 animate-pulse">
//         <div className="flex items-center justify-between mb-2">
//           <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32"></div>
//           <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
//         </div>
//         <div className="flex items-center justify-between">
//           <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
//           <div className="flex items-center gap-1">
//             <div className="h-3 w-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
//             <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4"></div>
//           </div>
//         </div>
//       </div>
//     ))}
//   </div>
// );

// // Skeleton for file upload component
// export const FileUploadSkeleton: React.FC = () => (
//   <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
//     {/* Header skeleton */}
//     <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
//       <div className="flex justify-between items-center">
//         <div className="flex items-center gap-2">
//           <div className="h-5 w-5 bg-slate-300 dark:bg-slate-600 rounded"></div>
//           <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-20"></div>
//           <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-8"></div>
//         </div>
//         <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-12"></div>
//       </div>
//     </div>

//     {/* Upload card skeleton */}
//     <div className="p-4">
//       <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
//         <div className="flex items-center gap-4">
//           <div className="p-3 rounded-full bg-slate-200 dark:bg-slate-700">
//             <div className="h-5 w-5 bg-slate-300 dark:bg-slate-600 rounded"></div>
//           </div>
//           <div className="flex-1">
//             <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32 mb-2"></div>
//             <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
//           </div>
//         </div>
//       </div>
//     </div>

//     {/* Files list skeleton */}
//     <div className="max-h-80 overflow-y-auto px-4 pb-4">
//       <div className="space-y-3">
//         <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
//         {[...Array(3)].map((_, index) => (
//           <div key={index} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
//             <div className="flex items-start gap-3">
//               <div className="flex-shrink-0 mt-0.5">
//                 <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
//               </div>
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center justify-between gap-2 mb-2">
//                   <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-40"></div>
//                   <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
//                   <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>
// );

// // Main skeleton for the entire dashboard
// export const DashboardSkeleton: React.FC = () => (
//   <div className="h-screen flex bg-slate-100 dark:bg-slate-900">
//     {/* Sidebar skeleton */}
//     <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col animate-pulse">
//       <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
//         <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
//         <div className="h-8 w-8 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
//       </div>
//       <div className="p-4 border-b border-slate-200 dark:border-slate-700">
//         <div className="h-9 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
//       </div>
//       <ChatListSkeleton />
//       <div className="border-t border-slate-200 dark:border-slate-700">
//         <FileUploadSkeleton />
//       </div>
//     </div>

//     {/* Main content skeleton */}
//     <div className="flex-1 flex flex-col">
//       {/* Header skeleton */}
//       <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm animate-pulse">
//         <div className="flex items-center gap-3">
//           <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700">
//             <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
//           </div>
//           <div>
//             <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-40 mb-1"></div>
//             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-56"></div>
//           </div>
//         </div>
//       </div>

//       <ChatMessagesSkeleton />

//       {/* Input area skeleton */}
//       <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 animate-pulse">
//         <div className="flex gap-3 max-w-4xl mx-auto">
//           <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
//           <div className="h-10 w-10 bg-slate-300 dark:bg-slate-600 rounded-md"></div>
//         </div>
//       </div>
//     </div>
//   </div>
// );























'use client';

import * as React from 'react';
import { Bot, User, FileText } from 'lucide-react';

export const MessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => (
  <div className={`flex gap-4 items-start ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
    {!isUser && (
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full p-3 h-fit">
        <Bot className="h-5 w-5 text-slate-400" />
      </div>
    )}
    <div className={`max-w-3xl ${isUser ? 'order-2' : ''}`}>
      <div className={`rounded-2xl px-6 py-4 shadow-lg ${
        isUser 
          ? 'bg-slate-200 dark:bg-slate-700' 
          : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50'
      }`}>
        <div className="space-y-2">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
          {!isUser && <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>}
        </div>
      </div>
      {!isUser && (
        <div className="mt-3 bg-slate-50/80 dark:bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-600/50 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20"></div>
            </div>
            <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
          </div>
        </div>
      )}
    </div>
    {isUser && (
      <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-3 h-fit">
        <User className="h-5 w-5 text-slate-400" />
      </div>
    )}
  </div>
);

export const ChatMessagesSkeleton: React.FC = () => (
  <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
    <MessageSkeleton isUser={true} />
    <MessageSkeleton isUser={false} />
    <MessageSkeleton isUser={true} />
    <MessageSkeleton isUser={false} />
  </div>
);

export const ChatListSkeleton: React.FC = () => (
  <div className="flex-1 overflow-y-auto p-2">
    {[...Array(6)].map((_, index) => (
      <div key={index} className="m-2 rounded-xl p-4 animate-pulse border-2 border-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32"></div>
          <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const FileUploadSkeleton: React.FC = () => (
  <div className="w-full max-w-md mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-pulse">
    <div className="relative p-5 border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
      <div className="relative flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-slate-300 dark:bg-slate-600 rounded"></div>
          <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-20"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-8"></div>
        </div>
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-12"></div>
      </div>
    </div>

    <div className="p-4">
      <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-200 dark:bg-slate-700">
            <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
          </div>
        </div>
      </div>
    </div>

    <div className="max-h-80 overflow-y-auto px-4 pb-4">
      <div className="space-y-3">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-40"></div>
                  <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="h-screen flex bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
    <div className="w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col animate-pulse shadow-2xl">
      <div className="relative p-5 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-24"></div>
          <div className="h-8 w-8 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
        </div>
      </div>
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded-xl w-full"></div>
      </div>
      <ChatListSkeleton />
    </div>

    <div className="flex-1 flex flex-col">
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4 shadow-sm animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-700">
            <div className="h-6 w-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
          </div>
          <div>
            <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded w-40 mb-1"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-56"></div>
          </div>
        </div>
      </div>

      <ChatMessagesSkeleton />

      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 px-6 py-5 animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div className="h-14 w-14 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-2xl"></div>
        </div>
      </div>
    </div>
  </div>
);
