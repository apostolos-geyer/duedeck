import { Card, styled } from "tamagui";

export const AppCard = styled(Card, {
  borderWidth: 2,
  borderColor: "$gray6",
  bg: "$gray1",
  rounded: 0,
  overflow: "hidden",

  variants: {
    variant: {
      elevated: {
        bg: "$background",
        borderColor: "$gray4",
        elevation: "$1",
      },
      flat: {
        bg: "$gray2",
        borderWidth: 0,
      },
      outlined: {
        bg: "transparent",
        borderColor: "$gray8",
        borderWidth: 2,
      },
      accent: {
        bg: "$purple2",
        borderColor: "$purple7",
        borderWidth: 2,
      },
    },
    size: {
      sm: { p: "$3" },
      md: { p: "$4" },
      lg: { p: "$5" },
    },
  } as const,

  defaultVariants: {
    variant: "elevated",
    size: "md",
  },
});

export const AppCardHeader = styled(Card.Header, {
  p: "$3",
});

export const AppCardFooter = styled(Card.Footer, {
  p: "$3",
  borderTopWidth: 1,
  borderTopColor: "$gray4",
});
