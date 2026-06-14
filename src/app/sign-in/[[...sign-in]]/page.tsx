import { SignIn } from "@clerk/nextjs";
import { ThemeProvider } from "../../../theme";

export default function SignInPage() {
  return (
    <ThemeProvider>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12 sm:px-6 lg:px-8">
        {/* Background radial glowing gradients */}
        <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse delay-1000"></div>

        {/* Decorative glass card container */}
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface/60 p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
              MailyFlow
            </h1>
            <p className="mt-2 text-sm text-muted">
              Control your AI workflows and integrations in one place
            </p>
          </div>

          <SignIn
            appearance={{
              elements: {
                card: "bg-transparent shadow-none border-none",
                headerTitle: "text-text font-semibold",
                headerSubtitle: "text-muted",
                socialButtonsBlockButton: "bg-surface border border-line hover:bg-surface2 text-text transition-all",
                socialButtonsBlockButtonText: "text-text",
                dividerLine: "bg-line",
                dividerText: "text-muted",
                formFieldLabel: "text-text",
                formFieldInput: "bg-surface2 border border-line text-text focus:border-accent focus:ring-accent",
                formButtonPrimary: "bg-accent hover:brightness-105 text-white shadow-md transition-all active:scale-95",
                footerActionLink: "text-accent hover:text-accent-glow",
                identityPreviewText: "text-text",
                identityPreviewEditButtonIcon: "text-muted",
              },
            }}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
