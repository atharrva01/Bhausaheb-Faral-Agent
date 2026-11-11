import type { Metadata } from "next";
import { OwnerAssistant } from "@/components/owner/OwnerAssistant";

export const metadata: Metadata = { title: "Owner assistant · Bhausaheb Faral" };

export default function OwnerAssistantPage() {
  return <OwnerAssistant />;
}
