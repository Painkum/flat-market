import { CreatorStudio } from "@/components/creator/CreatorStudio";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CreatePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow="Creator studio" title="Issue a collectible">
        Create a collection, set the utility, then mint a capped edition. Review every condition before you send the transaction.
      </PageHeader>
      <CreatorStudio />
    </div>
  );
}
