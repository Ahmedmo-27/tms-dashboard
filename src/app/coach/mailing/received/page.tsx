import { MailingInbox } from "@/components/mailing/MailingInbox";

export default function CoachReceivedPage() {
  return <MailingInbox composeUrl="/coach/mailing" />;
}
