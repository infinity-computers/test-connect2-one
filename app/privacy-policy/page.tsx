import type { Metadata } from "next";
import LegalPolicyPage from "../../components/legal/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Connect One Networks",
  description: "Privacy Policy for Connect One Networks customer portal and broadband services.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPolicyPage
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      description="This policy explains how Connect One Networks collects, uses, stores, and protects customer information while providing internet services and customer portal access."
      sections={[
        {
          title: "Information We Collect",
          items: [
            "We may collect customer details such as name, phone number, email address, installation address, service location, billing details, selected plan, support requests, and ticket history.",
            "When customers use our website or customer portal, we may collect technical information such as login activity, device/browser details, IP address, and usage logs required for security and service operation.",
            "Payment-related information may be processed through authorized payment partners. We do not store complete card, UPI, or net-banking credentials on our systems.",
          ],
        },
        {
          title: "How We Use Information",
          items: [
            "Customer information is used to activate broadband services, manage subscriptions, provide support, verify requests, process billing, and communicate service updates.",
            "Support and ticket information may be used by admin and technician teams to diagnose issues, assign work, and confirm resolution.",
            "We may use contact details to send service-related messages such as payment reminders, outage updates, ticket updates, renewal reminders, or important account notices.",
          ],
        },
        {
          title: "Sharing of Information",
          items: [
            "We do not sell customer personal information.",
            "Information may be shared with internal staff, technicians, payment processors, hosting providers, messaging/email providers, or legal/regulatory authorities when required for service delivery, compliance, or dispute handling.",
            "Technicians may receive only the information needed to complete installation, maintenance, or support work.",
          ],
        },
        {
          title: "Data Security and Retention",
          items: [
            "We use reasonable technical and operational safeguards to protect customer information from unauthorized access, misuse, loss, or alteration.",
            "Customer records may be retained for as long as required for active service, billing, support, legal compliance, accounting, dispute resolution, and internal audit purposes.",
            "No internet-based system can be guaranteed to be fully secure, but we take practical measures to reduce risk and protect customer data.",
          ],
        },
        {
          title: "Customer Rights and Requests",
          items: [
            "Customers may contact us to request correction of inaccurate profile, contact, or billing information.",
            "Requests related to data access, correction, or deletion will be reviewed based on service status, legal obligations, billing records, and operational requirements.",
            "Customers are responsible for keeping their contact details updated so service alerts and support communications can be delivered correctly.",
          ],
        },
      ]}
    />
  );
}
