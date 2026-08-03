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

// loremflickr はキーワードだけを指定するとリロードのたびに別の写真が返るため、
// キーワードから決まる固定値を lock パラメータに渡して、同じ議案には常に同じ写真を表示する。
function lockFromKeyword(keyword: string): number {
  let hash = 5381;
  for (let i = 0; i < keyword.length; i++) {
    hash = ((hash << 5) + hash + keyword.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 100000;
}

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
          src={`https://loremflickr.com/640/256/${thumbnail.keyword}?lock=${lockFromKeyword(thumbnail.keyword)}`}
          alt=""
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
