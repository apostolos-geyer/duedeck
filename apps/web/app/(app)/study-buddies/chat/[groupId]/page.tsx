"use client";
import { use } from "react";
import { ChatScreen } from "@repo/app/screens/study-buddies";
export default function ChatPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  return <ChatScreen groupId={groupId} />;
}
