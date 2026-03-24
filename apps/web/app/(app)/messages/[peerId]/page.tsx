import { DirectChatScreen } from "@repo/app/screens/messages";

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ peerId: string }>;
}) {
  const { peerId } = await params;
  return <DirectChatScreen peerUserId={peerId} />;
}
