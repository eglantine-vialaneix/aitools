"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { readEvaluationResponses } from "@/app/lib/evaluationResponses";

const BACKGROUND_IMAGE = "/background.png";
const subscribeToStorage = () => () => {};
const getSavedResponsesSnapshot = () => readEvaluationResponses() !== null;
const getServerSavedResponsesSnapshot = () => null;

export default function EvaluationFinishedPage() {
  const router = useRouter();
  const hasSavedResponses = useSyncExternalStore(
    subscribeToStorage,
    getSavedResponsesSnapshot,
    getServerSavedResponsesSnapshot,
  );

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat p-[40px] text-[#18181b]"
      style={{ backgroundImage: `url('${BACKGROUND_IMAGE}')` }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex w-full max-w-[720px] flex-col items-center gap-[18px] rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[44px] text-center shadow-[-7px_7px_4px_0px_rgba(0,0,0,0.25)]">
        <p className="text-[16px] font-medium text-[#52525b]">Activité terminée</p>
        <h1 className="text-[42px] font-bold leading-[1.1] text-[#18181b]">Merci !</h1>
        <p className="max-w-[540px] text-[18px] leading-[1.45] text-[#3f3f46]">
          {hasSavedResponses === true
            ? "Tes réponses ont bien été sauvegardées. Tu peux maintenant fermer cette page."
            : hasSavedResponses === false
              ? "Aucune sauvegarde n'a été trouvée. Reviens à l'évaluation pour enregistrer tes réponses."
              : "Vérification de la sauvegarde..."}
        </p>
        {hasSavedResponses === false && (
          <Button
            className="mt-[8px] min-h-[40px] rounded-[22px] bg-[#006fee] px-[18px] text-[15px] font-medium text-white"
            onPress={() => router.push("/evaluation")}
          >
            Retour à l&apos;évaluation
          </Button>
        )}
      </main>
    </div>
  );
}
