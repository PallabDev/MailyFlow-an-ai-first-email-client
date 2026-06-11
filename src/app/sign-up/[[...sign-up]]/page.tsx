import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background radial glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-1000"></div>

      {/* Decorative glass card container */}
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AgentiFlow
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create an account to start configuring your agent integrations
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              card: "bg-transparent shadow-none border-none",
              headerTitle: "text-slate-100 font-semibold",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-slate-800 border-white/10 hover:bg-slate-700/80 text-slate-200",
              socialButtonsBlockButtonText: "text-slate-200",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500",
              formFieldLabel: "text-slate-300",
              formFieldInput: "bg-slate-900 border-white/10 text-slate-200 focus:border-indigo-500 focus:ring-indigo-500",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20",
              footerActionLink: "text-indigo-400 hover:text-indigo-300",
              identityPreviewText: "text-slate-200",
              identityPreviewEditButtonIcon: "text-slate-400",
            },
          }}
        />
      </div>
    </div>
  );
}
