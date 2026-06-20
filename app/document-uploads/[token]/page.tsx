import CustomerDocumentUploadClient from "./_components/CustomerDocumentUploadClient";

export default async function DocumentUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerDocumentUploadClient token={token} />;
}
