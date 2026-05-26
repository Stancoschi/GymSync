import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Intra in contul tau GymSync.
        </p>

        {params?.message ? (
          <p className="mb-4 rounded-md bg-muted p-3 text-sm">
            {params.message}
          </p>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}