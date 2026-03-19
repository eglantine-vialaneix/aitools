import Link from "next/link";
import { HomeIdentificationField } from "./components/HomeIdentificationField";

export default function Home() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 bg-cover bg-center bg-no-repeat text-zinc-900 dark:text-zinc-100"
      style={{ backgroundImage: "url('/Robot%20Archaeologist%20Background.png')" }}
    >
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-4xl font-bold">Welcome to AI Tools!</h1>
        <p className="max-w-xl text-center text-lg text-zinc-600 dark:text-zinc-300">
          Let's learn about Machine Learning together! {/* TODO: refine intro text */}
          You are an archeologist who needs to build a model to recognize if a dinosaur is herbivore or carnivore.
          You will have to follow the basic steps of what is called in Computer Science: Machine Learning.
          You will basically teach your computer (a machine) how to recognize dinosaurs and their diet so that later, the model will be able to predict if 
          a dinosaur that it has never seen before is probably herbivore or carnivore.
        </p>
        <HomeIdentificationField />
        <Link
          href="/data_labelling"
          className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          Let's go!
        </Link>
      </main>
    </div>
  );
}
