import { MailingLayoutShell } from "@/components/mailing/MailingLayoutShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MailingLayoutShell basePath="/coach/mailing">{children}</MailingLayoutShell>;
}
