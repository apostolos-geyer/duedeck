import { H2, Paragraph, XStack, YStack, styled } from "tamagui";

const HeaderFrame = styled(YStack, {
  name: "PageHeader",
  gap: "$1",
  mb: "$4",
});

const HeaderTitle = styled(H2, {
  name: "PageHeaderTitle",
  fontFamily: "$heading",
  color: "$color12",
});

const HeaderSubtitle = styled(Paragraph, {
  name: "PageHeaderSubtitle",
  color: "$gray10",
  size: "$3",
});

const HeaderActions = styled(XStack, {
  name: "PageHeaderActions",
  gap: "$2",
  items: "center",
  mt: "$2",
});

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <HeaderFrame>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <YStack gap="$1" flex={1}>
          <HeaderTitle>{title}</HeaderTitle>
          {subtitle ? <HeaderSubtitle>{subtitle}</HeaderSubtitle> : null}
        </YStack>
        {children ? <HeaderActions>{children}</HeaderActions> : null}
      </XStack>
    </HeaderFrame>
  );
}
