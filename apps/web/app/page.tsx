"use client";

import { Button, H1, Paragraph, YStack } from "@repo/ui";

export default function Home() {
  return (
    <YStack gap="$4" items="center" p="$6" grow={1}>
      <H1>DueDeck</H1>
      <Paragraph>
        Get started by editing <code>apps/web/app/page.tsx</code>
      </Paragraph>
      <Button onPress={() => alert("Hello from DueDeck!")}>Open alert</Button>
    </YStack>
  );
}
