import { CreatorStudio } from "@/components/creator/CreatorStudio";

export default function CreatePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-ink-soft uppercase">Creator studio</p>
        <h1 className="display mt-2 text-5xl">Issue a collectible</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Create a collection, set the utility, then mint a capped edition. Review every condition before you send the transaction.
        </p>
      </div>
      <CreatorStudio />
    </div>
  );
}
