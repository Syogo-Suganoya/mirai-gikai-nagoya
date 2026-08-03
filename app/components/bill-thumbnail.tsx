import type { BillThumbnail, BillIllustration } from "@/data/bills";
import BudgetIllustration from "./thumbnails/budget-illustration";
import ChildcareIllustration from "./thumbnails/childcare-illustration";
import EducationIllustration from "./thumbnails/education-illustration";
import CommunityIllustration from "./thumbnails/community-illustration";
import OrganizationIllustration from "./thumbnails/organization-illustration";

const illustrations: Record<
  BillIllustration,
  (props: { className?: string }) => React.ReactElement
> = {
  budget: BudgetIllustration,
  childcare: ChildcareIllustration,
  education: EducationIllustration,
  community: CommunityIllustration,
  organization: OrganizationIllustration,
};

export default function BillThumbnailView({
  thumbnail,
}: {
  thumbnail?: BillThumbnail;
}) {
  if (!thumbnail) return null;

  return (
    <div className="aspect-[5/2] w-full overflow-hidden rounded-lg bg-zinc-100">
      {thumbnail.type === "illustration" ? (
        (() => {
          const Illustration = illustrations[thumbnail.illustration];
          return <Illustration className="h-full w-full" />;
        })()
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://loremflickr.com/640/256/${thumbnail.keyword}`}
          alt=""
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
