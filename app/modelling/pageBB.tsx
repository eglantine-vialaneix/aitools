"use client";

import Link from "next/link";
import { MODEL_CONFIGS, type ModelId, type ModellingCondition } from "./modelConfig";
import { markModelAsTrained } from "./trainingState";

type ModellingBlackBoxProps = {
  model?: ModelId;
  condition?: ModellingCondition;
};

export default function ModellingBlackBox({
  model = "A",
  condition = "BB",
}: ModellingBlackBoxProps) {
  const modelConfig = MODEL_CONFIGS[model];
  const baseConfidence = model === "A" ? 82 : model === "B" ? 74 : 68;
  const predictionRows = [
    { name: "Allosaurus", prediction: "carnivore", confidence: baseConfidence },
    { name: "Iguanodon", prediction: "herbivore", confidence: Math.max(58, baseConfidence - 9) },
    { name: "Compsognathus", prediction: "carnivore", confidence: Math.max(55, baseConfidence - 14) },
  ];

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[50px] py-[60px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative grid min-h-[calc(100dvh-120px)] w-full max-w-[1190px] grid-cols-[0.9fr_1.1fr] gap-[28px] rounded-[24px] border border-white/40 bg-[#efefef]/85 p-[40px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-[2px]">
        <section className="flex flex-col justify-between rounded-[16px] bg-white p-[28px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_14px_28px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[15px] font-medium text-[#52525b]">Condition {condition}</p>
            <h1 className="mt-[8px] text-[36px] font-extrabold leading-[1.12]">
              {modelConfig.title}
            </h1>
            <p className="mt-[18px] text-[20px] font-bold leading-[1.34] text-[#3f3f46]">
              Le modèle est une boîte noire: tu peux observer les entrées, les sorties et les scores,
              mais pas les règles internes.
            </p>
          </div>

          <div className="mt-[28px] grid grid-cols-2 gap-[12px]">
            <div className="rounded-[12px] bg-[#ff383c] p-[16px] text-white">
              <p className="text-[13px] font-medium">Carnivores</p>
              <p className="text-[32px] font-extrabold leading-none">{modelConfig.pred_carnivores}</p>
            </div>
            <div className="rounded-[12px] bg-[#17c964] p-[16px] text-white">
              <p className="text-[13px] font-medium">Herbivores</p>
              <p className="text-[32px] font-extrabold leading-none">{modelConfig.pred_herbivores}</p>
            </div>
          </div>

          <Link
            href={`/modelling?condition=${condition}`}
            onClick={() =>
              markModelAsTrained(model, {
                pred_carnivores: modelConfig.pred_carnivores,
                pred_herbivores: modelConfig.pred_herbivores,
              })
            }
            className="mt-[28px] inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#dedee0] bg-white px-[18px] text-[15px] font-medium text-[#18181b] transition hover:border-[#b8b8bf]"
          >
            Terminer l&apos;entraînement
          </Link>
        </section>

        <section className="flex min-h-0 flex-col gap-[18px] rounded-[16px] bg-white p-[28px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_14px_28px_rgba(0,0,0,0.08)]">
          <div>
            <h2 className="text-[24px] font-bold leading-[1.2]">Sorties du modèle</h2>
            <p className="mt-[8px] text-[16px] leading-[1.45] text-[#52525b]">
              Observe les sorties produites par le modèle sans accéder à ses caractéristiques internes.
            </p>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-[#dedee0]">
            <table className="w-full border-collapse text-left text-[15px]">
              <thead className="bg-[#f4f4f5] text-[#3f3f46]">
                <tr>
                  <th className="px-[14px] py-[12px] font-semibold">Dinosaure</th>
                  <th className="px-[14px] py-[12px] font-semibold">Prédiction</th>
                  <th className="px-[14px] py-[12px] font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {predictionRows.map((row) => (
                  <tr key={row.name} className="border-t border-[#ededf0]">
                    <td className="px-[14px] py-[12px] font-medium">{row.name}</td>
                    <td className="px-[14px] py-[12px]">
                      <span className={`rounded-full px-[12px] py-[5px] text-[13px] font-medium text-white ${
                        row.prediction === "carnivore" ? "bg-[#ff383c]" : "bg-[#17c964]"
                      }`}>
                        {row.prediction}
                      </span>
                    </td>
                    <td className="px-[14px] py-[12px]">{row.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-auto rounded-[12px] bg-[#eaeaea] p-[18px]">
            <p className="text-[14px] font-medium text-[#52525b]">Indice de layout</p>
            <p className="mt-[4px] text-[18px] font-bold text-[#18181b]">
              {modelConfig.data === "df_train.csv" ? "Données complètes" : "Sous-ensemble de données"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
