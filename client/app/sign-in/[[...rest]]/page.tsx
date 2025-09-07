import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue chatting with your PDFs
          </p>
        </div>
        <SignIn 
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
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