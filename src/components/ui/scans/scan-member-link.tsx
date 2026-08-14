import Link from "next/link";

export function ScanMemberLink({
  name,
  memberId,
}: {
  name: string;
  memberId?: string;
}) {
  if (!memberId) {
    return <span className="font-medium">{name}</span>;
  }

  return (
    <Link
      href={`/dashboard/our-members/${memberId}`}
      className="font-medium text-primary hover:underline"
    >
      {name}
    </Link>
  );
}
