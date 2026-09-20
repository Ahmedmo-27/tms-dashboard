import Link from "next/link";

export function ScanMemberLink({
  name,
  memberId,
  href,
}: {
  name: string;
  memberId?: string;
  href?: string;
}) {
  if (!memberId) {
    return <span className="font-medium">{name}</span>;
  }

  return (
    <Link
      href={href ?? `/dashboard/our-members/${memberId}`}
      className="font-medium text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {name}
    </Link>
  );
}
