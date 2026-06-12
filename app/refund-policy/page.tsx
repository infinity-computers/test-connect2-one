import type { Metadata } from "next";
import LegalPolicyPage from "../../components/legal/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Refund and Return Policy | Connect One Networks",
  description: "Refund and return policy for Connect One Networks broadband plans, installation, and equipment handling.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPolicyPage
      eyebrow="Refund & Return Policy"
      title="Refund and Return Policy"
      description="This policy explains how refunds, cancellations, duplicate payments, and equipment returns are handled for Connect One Networks services."
      sections={[
        {
          title: "Plan Payments and Activation",
          items: [
            "Broadband plan payments are generally non-refundable once the plan has been activated or internet service has been used.",
            "If service activation is not technically feasible at the customer's location after payment, the customer may be eligible for a refund after verification by our team.",
            "Installation, activation, wiring, or setup charges, if collected separately, may be non-refundable once installation work has started or been completed.",
          ],
        },
        {
          title: "Duplicate or Failed Payments",
          items: [
            "If a duplicate payment is received for the same plan or invoice, the duplicate amount may be refunded or adjusted against the customer's future bill after verification.",
            "If a payment is debited from the customer but not reflected in our system, the customer should contact support with transaction details for verification with the payment provider or bank.",
            "Refund timelines may depend on bank, UPI, card network, or payment gateway processing schedules.",
          ],
        },
        {
          title: "Cancellation and Refund Requests",
          items: [
            "Refund or cancellation requests must be raised through our support contact with customer name, registered phone number, payment details, and reason for request.",
            "Approved refunds will normally be processed to the original payment method or another verified method approved by the business.",
            "Partial refunds, if any, will be decided case by case based on activation status, usage, installation work, plan validity, and operational costs already incurred.",
          ],
        },
        {
          title: "Equipment Returns",
          items: [
            "Any equipment provided by Connect One Networks, such as ONU/ONT or other network devices, remains subject to the ownership or return terms communicated at the time of installation.",
            "Returned equipment must be in working condition, without physical damage, missing accessories, tampering, or unauthorized modification.",
            "Customer-owned routers, extenders, internal wiring, or third-party devices are not covered under this return policy unless separately sold or documented by Connect One Networks.",
          ],
        },
        {
          title: "Non-Refundable Cases",
          items: [
            "Refunds may not be available for service issues caused by customer-side routers, internal wiring, device configuration, Wi-Fi coverage limitations, power issues, or third-party equipment.",
            "Refunds may not be available for temporary outages caused by maintenance, force majeure events, upstream provider issues, cable cuts, or circumstances outside reasonable control.",
            "Refunds may be denied where customer details, payment proof, or service records cannot be verified.",
          ],
        },
      ]}
    />
  );
}
