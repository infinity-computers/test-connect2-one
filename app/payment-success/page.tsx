import PaymentSuccessClient from "./_components/PaymentSuccessClient";

interface PaymentSuccessPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default function Page({ searchParams }: PaymentSuccessPageProps) {
  const toValue = (key: string) => {
    const value = searchParams?.[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
  };

  const queryParams = {
    payment_id: toValue("payment_id"),
    order_id: toValue("order_id"),
    subscription_id: toValue("subscription_id"),
  };

  return <PaymentSuccessClient queryParams={queryParams} />;
}
