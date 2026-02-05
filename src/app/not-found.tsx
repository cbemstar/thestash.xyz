import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <main className="mx-auto max-w-5xl w-full text-center">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <p className="mt-8">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
