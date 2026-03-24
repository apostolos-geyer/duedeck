"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function usePeerProfile(userId: string | null) {
  const orpc = useOrpc();
  return useQuery({
    ...orpc.users.peerProfile.queryOptions({
      input: { userId: userId ?? "" },
    }),
    enabled: !!userId,
  });
}

export function useDirectMessages(peerUserId: string) {
  const orpc = useOrpc();
  return useQuery({
    ...orpc.directMessages.list.queryOptions({
      input: { peerUserId },
    }),
    refetchInterval: 4_000,
  });
}

export function useSendDirectMessage() {
  const orpc = useOrpc();
  return useMutation(orpc.directMessages.send.mutationOptions());
}
