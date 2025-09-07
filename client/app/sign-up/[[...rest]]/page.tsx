import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Chat-PDF
          </h1>
          <p className="text-gray-600">
            Create your account to start chatting with PDFs
          </p>
        </div>
        <SignUp 
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
              card: "shadow-lg",
              headerTitle: "hidden",
              headerSubtitle: "hidden"
            }
          }}
        />
      </div>
    </div>
  )
}