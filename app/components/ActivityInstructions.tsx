"use client";

import { Button } from "@heroui/react";
import { type ReactNode } from "react";

type ActivityInstructionsOverlayProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

type ActivityInstructionsButtonProps = {
  onPress: () => void;
};

export function ActivityInstructionsOverlay({
  title,
  children,
  onClose,
}: ActivityInstructionsOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-[24px] py-[24px] backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-instructions-title"
        className="flex max-h-full w-full max-w-[640px] flex-col gap-[18px] overflow-auto rounded-[24px] border border-[#dedee0] bg-white p-[28px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]"
      >
        <div>
          <p className="text-[14px] font-medium text-[#52525b]">Avant de commencer</p>
          <h2 id="activity-instructions-title" className="mt-[6px] text-[28px] font-extrabold leading-[1.12]">
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-[12px] text-[16px] leading-[1.5] text-[#3f3f46]">
          {children}
        </div>
        <div className="flex justify-end">
          <Button
            className="min-h-[40px] rounded-full bg-[#0485f7] px-[18px] text-[15px] font-medium text-white"
            onPress={onClose}
          >
            C&apos;est parti !
          </Button>
        </div>
      </section>
    </div>
  );
}

export function ActivityInstructionsButton({ onPress }: ActivityInstructionsButtonProps) {
  return (
    <Button
      className="fixed left-[16px] top-[16px] z-40 min-h-[32px] rounded-full border border-white/50 bg-white/90 px-[12px] text-[13px] font-medium text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-[20px] transition hover:bg-white"
      onPress={onPress}
    >
      Euh je dois faire quoi déjà ?
    </Button>
  );
}

type ActivityCondition = "WB" | "BB";

export function DataLabellingInstructionsContent({ condition }: { condition: ActivityCondition }) {
  if (condition === "WB") {
    return (
      <>
        <p>
          Voici les fiches d&apos;information que tu as pu collecter sur 10 dinosaures. Lis-les
          attentivement et prends des notes sur les indices qui peuvent t&apos;aider à comprendre leur
          régime alimentaire.
        </p>
        <p>
          Pour chaque fiche, classe le dinosaure dans la catégorie qui te semble correcte:
          carnivore ou herbivore. Tu peux t&apos;appuyer sur ses caractéristiques, son anatomie, son
          habitat ou toute autre information utile présente sur la fiche.
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        Voici les fiches d&apos;information que tu as pu collecter sur 10 dinosaures. Lis-les et
        prends des notes sur les informations disponibles: taille, période, habitat, type de
        dinosaure ou tout autre indice qui te semble important.
      </p>
      <p>
        Ces dinosaures ont déjà été classifiés manuellement entre carnivores et herbivores.
        Observe bien les fiches et le classement obtenu: ces informations te serviront pour la
        suite de l&apos;enquête.
      </p>
    </>
  );
}

export function FeatureSelectionInstructionsContent({ condition }: { condition: ActivityCondition }) {
  if (condition === "WB") {
    return (
      <>
        <p>
          Tu as pu voir que tu avais beaucoup d&apos;informations sur chaque dinosaure. Tu as décidé
          de les organiser dans un tableau, en regroupant tes 10 fiches avec celles que certains de
          tes collègues ont aussi pu étiqueter.
        </p>
        <p>
          Tu dois maintenant choisir 4 caractéristiques qui te semblent les plus judicieuses pour
          déterminer si un dinosaure est carnivore ou herbivore. Cherche des colonnes qui pourraient
          vraiment aider un modèle à faire la différence entre les deux régimes.
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        Tu as pu voir que tu avais beaucoup d&apos;informations sur chaque dinosaure. Tu as décidé de
        les organiser dans un tableau, en regroupant tes 10 fiches avec celles que certains de tes
        collègues ont aussi pu étiqueter.
      </p>
      <p>
        Tu dois maintenant indiquer le type de chaque colonne. Une colonne est numérique quand elle
        contient des nombres mesurables, comme une longueur ou un poids. Elle est catégorique quand
        elle décrit une catégorie, comme une période, un habitat ou une famille. Elle est booléenne
        quand elle ne peut prendre que deux valeurs, par exemple vrai/faux ou oui/non.
      </p>
    </>
  );
}

export function ModellingInstructionsContent({ condition }: { condition: ActivityCondition }) {
  if (condition === "WB") {
    return (
      <>
        <p>
          Maintenant que tu as fini de préparer tes données, tu vas pouvoir les donner à différents
          modèles d&apos;apprentissage automatique pour les entraîner.
        </p>
        <p>
          Pour chaque modèle, inspecte d&apos;abord les données qui lui sont transmises, puis lance
          l&apos;entraînement. Observe ensuite comment le modèle utilise les caractéristiques choisies
          pour différencier les dinosaures carnivores des dinosaures herbivores.
        </p>
      </>
    );
  }

  return (
    <>
      <p>
        Maintenant que tu as fini de préparer tes données, tu vas pouvoir les donner à différents
        modèles d&apos;apprentissage automatique pour les entraîner.
      </p>
      <p>
        Pour chaque modèle, inspecte les données qui lui sont transmises, lance l&apos;entraînement,
        puis observe le résultat obtenu. Ton objectif est de comprendre, à partir de ce que tu peux
        voir, comment chaque modèle parvient à différencier les carnivores des herbivores.
      </p>
    </>
  );
}

export function EvaluationInstructionsContent() {
  return (
    <>
      <p>
        Dernière étape ! Tu as pu entraîner 3 modèles à reconnaître le régime alimentaire d&apos;un
        dinosaure. Voyons maintenant comment chacun performe sur des dinosaures qu&apos;il n&apos;a encore
        jamais rencontrés.
      </p>
      <p>
        Pour cela, tu vas calculer l&apos;exactitude, qui indique quelle proportion des dinosaures a
        été correctement classifiée, puis compléter la matrice de confusion, qui regarde séparément
        comment chaque catégorie est prédite. Inspecte les tableaux de test pour retrouver les
        bonnes valeurs.
      </p>
    </>
  );
}

export function GiniInstructionsContent() {
  return (
    <>
      <p>
        Tu vas entraîner un arbre de décision. Ce type de modèle choisit des questions successives
        pour séparer les dinosaures en groupes de plus en plus purs: idéalement, un groupe contient
        seulement des carnivores ou seulement des herbivores.
      </p>
      <p>
        Pour comparer les séparations possibles, on calcule l&apos;impureté de Gini. Pour un groupe,
        la formule est: 1 - proportion(carnivores)^2 - proportion(herbivores)^2. Plus le résultat
        est proche de 0, plus le groupe est pur.
      </p>
      <p>
        Exemple: dans un groupe de 5 dinosaures avec 4 carnivores et 1 herbivore, l&apos;impureté vaut
        1 - (4/5)^2 - (1/5)^2 = 0,32. Un groupe avec 5 carnivores et 0 herbivore vaut 0: il est
        parfaitement pur. À chaque étape, choisis la séparation qui rend les groupes obtenus les
        plus purs possible.
      </p>
    </>
  );
}
