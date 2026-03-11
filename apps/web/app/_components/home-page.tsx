"use client";

import { signOut } from "@repo/auth/client";
import { Button, H1, Paragraph, YStack } from "@repo/ui";
import { useRouter } from "next/navigation";

interface HomePageProps {
  user: {
    name: string;
    email: string;
  };
}

export function HomePage({ user }: HomePageProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  return (
    <YStack gap="$4" items="center" p="$6" grow={1}>
      <H1>Welcome, {user.name}</H1>
      <Paragraph>{user.email}</Paragraph>
      <Button onPress={handleSignOut}>Sign Out</Button>
    </YStack>
  );
}
