"use client";

export default function FeatureSelectionWhiteBox() {
  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[50px] py-[60px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-120px)] w-full max-w-[1180px] flex-col justify-center rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[56px] shadow-[-7px_7px_4px_0px_rgba(0,0,0,0.25)]">
        <h1 className="text-[48px] font-bold leading-[1.12]">Feature selection WB</h1>
        <p className="mt-[24px] max-w-[760px] text-[22px] leading-[1.45] text-[#3f3f46]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cette page recevra la condition
          White-Box pour la sélection des caractéristiques.
        </p>
      </main>
    </div>
  );
}
