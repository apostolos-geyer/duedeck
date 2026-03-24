import {
  H3,
  Paragraph,
  YStack,
  createStyledContext,
  styled,
  withStaticProperties,
} from "tamagui";

const SectionContext = createStyledContext({
  variant: "default" as "default" | "accent",
});

const SectionFrame = styled(YStack, {
  name: "Section",
  context: SectionContext,
  gap: "$3",

  variants: {
    variant: {
      default: {},
      accent: {
        bg: "$purple2",
        p: "$4",
        borderWidth: 2,
        borderColor: "$purple6",
      },
    },
  } as const,

  defaultVariants: {
    variant: "default",
  },
});

const SectionTitle = styled(H3, {
  name: "SectionTitle",
  context: SectionContext,
  fontFamily: "$heading",
  color: "$color12",
});

const SectionDescription = styled(Paragraph, {
  name: "SectionDescription",
  context: SectionContext,
  color: "$gray10",
  size: "$3",
});

const SectionContent = styled(YStack, {
  name: "SectionContent",
  context: SectionContext,
  gap: "$2",
});

export const ContentSection = withStaticProperties(SectionFrame, {
  Title: SectionTitle,
  Description: SectionDescription,
  Content: SectionContent,
});
