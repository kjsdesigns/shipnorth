import TrackingClient from './TrackingClient';

export async function generateStaticParams() {
  return [];
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;
  return <TrackingClient trackingNumber={trackingNumber} />;
}
