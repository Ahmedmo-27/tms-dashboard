import { MailingInbox } from "@/components/mailing/MailingInbox";

export default function ReceivedPage() {
  return <MailingInbox composeUrl="/dashboard/mailing" />;
}
