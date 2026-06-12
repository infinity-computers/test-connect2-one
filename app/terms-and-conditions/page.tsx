import type { Metadata } from "next";
import LegalPolicyPage from "../../components/legal/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Terms and Conditions | Connect One Networks",
  description: "Terms and Conditions for Connect One Networks broadband services and customer portal.",
};

export default function TermsAndConditionsPage() {
  return (
    <LegalPolicyPage
      eyebrow="Terms & Conditions"
      title="Terms and Conditions"
      description="These terms define the basic rules for using Connect One Networks broadband services, website, customer portal, and support systems."
      sections={[
        {
          title: "Service Usage",
          items: [
            "Customers must use the internet service in a lawful and responsible manner and must not use it for illegal, abusive, fraudulent, harmful, or unauthorized activities.",
            "Customers are responsible for all usage through their connection, including usage by family members, guests, employees, or any person connected through their router or network.",
            "The customer must not resell, redistribute, or commercially share the internet connection without written permission from Connect One Networks.",
          ],
        },
        {
          title: "Plans, Billing, and Renewals",
          items: [
            "Plan speed, price, validity, and benefits are based on the selected plan and may change from time to time with business or regulatory requirements.",
            "Plan renewal is the customer's responsibility. Services may be suspended, slowed, or disconnected after plan expiry or non-payment.",
            "Invoices, payment records, and subscription details shown on the portal are maintained for operational convenience and may be updated after verification if discrepancies are found.",
          ],
        },
        {
          title: "Installation and Customer Premises",
          items: [
            "Installation is subject to technical feasibility, network availability, permission from society/building/landlord if applicable, and access to the premises.",
            "Customer-side internal wiring, router placement, LAN configuration, Wi-Fi coverage, concealed wiring, civil work, and electrician work are outside the default service scope unless separately agreed.",
            "Customers must provide safe access for installation and maintenance work and ensure that any required premises permissions are available before technician visits.",
          ],
        },
        {
          title: "Support and Tickets",
          items: [
            "Customers may raise service tickets through the website, portal, phone, WhatsApp, or other approved support channels.",
            "Tickets may be reviewed by admin staff before technician assignment to confirm legitimacy, priority, and required action.",
            "Resolution timelines may vary depending on issue type, location, technician availability, upstream provider status, permissions, and external conditions.",
          ],
        },
        {
          title: "Service Limitations",
          items: [
            "Internet speed may vary due to customer device capability, router quality, Wi-Fi interference, website/server limitations, network congestion, or third-party service conditions.",
            "Connect One Networks is not liable for indirect loss, business loss, data loss, device damage, or third-party service disruption arising from internet downtime or degraded performance.",
            "The company may perform maintenance, upgrades, or emergency repairs that can temporarily affect service availability.",
          ],
        },
        {
          title: "Account Suspension or Termination",
          items: [
            "Service may be suspended or terminated for non-payment, misuse, illegal activity, tampering with network equipment, abusive behavior toward staff, or violation of these terms.",
            "The customer must not damage, relocate, tamper with, or modify network equipment or cabling provided by Connect One Networks without permission.",
            "Any outstanding dues, equipment recovery, or damage charges may remain payable even after service cancellation or termination.",
          ],
        },
      ]}
    />
  );
}
