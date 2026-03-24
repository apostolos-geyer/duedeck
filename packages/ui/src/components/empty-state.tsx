import { Button, H4, Paragraph, YStack } from "tamagui";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <YStack items="center" justify="center" p="$6" gap="$3" flex={1} minH={200}>
      <H4 fontFamily="$heading" color="$gray11" text="center">
        {title}
      </H4>
      <Paragraph color="$gray9" size="$3" text="center" maxW={360}>
        {description}
      </Paragraph>
      {actionLabel && onAction ? (
        <Button theme="purple" onPress={onAction} mt="$2">
          {actionLabel}
        </Button>
      ) : null}
    </YStack>
  );
}
