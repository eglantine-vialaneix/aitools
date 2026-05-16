import Link from "next/link";
import { HomeIdentificationField } from "./components/HomeIdentificationField";

export default function Home() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 bg-cover bg-center bg-no-repeat text-zinc-900 dark:text-zinc-100"
      style={{ backgroundImage: "url('/Robot%20Archaeologist%20Background.png')" }}
    >
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-4xl font-bold">Bienvenue dans AI Tools !</h1>
        <p className="max-w-xl text-center text-lg text-zinc-600 dark:text-zinc-300">
          Aujourd&apos;hui, tu vas incarner le rôle d&apos;un(e) archéologue moderne. Pour tes recherches, tu as besoin
          de classifier tous les dinosaures déjà découverts entre Carnivores et Herbivores. Sachant que leur nombre grandi chaque année,
          tu décides de recourir au Machine Learning (ou Apprentissage Automatique) pour t&apos;aider à automatiser cette longue tâche. Ensemble, nous allons donc entraîner
          un ordinateur à reconnaître si un dinosaure est herbivore ou carnivore compte tenu de ce que nous savons déjà sur le spécimen.
        </p>
        <HomeIdentificationField />
        <Link
          href="/data_labelling"
          className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          C&apos;est parti !
        </Link>
      </main>
    </div>
  );
}
