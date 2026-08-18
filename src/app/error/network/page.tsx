import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";

export default function Page() {
  return (
    <NetworkErrorPage
      title="Network Error"
      description="Unable to reach the server. Please check your connection and try again."
      showBackButton
    />
  );
}
