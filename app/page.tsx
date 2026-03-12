import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-4xl font-bold">Welcome to the AI Data Labelling Activity</h1>
        <p className="max-w-xl text-center text-lg text-zinc-600 dark:text-zinc-300">
          Click the button below to open the Data Labelling studio (from the Figma design) and start labeling items.
        </p>
        <Link
          href="/data_labelling"
          className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          Start the activity
        </Link>
      </main>
    </div>
  );
}
