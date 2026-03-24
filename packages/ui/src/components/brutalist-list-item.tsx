import { ListItem, styled } from "tamagui";

export const BrutalistListItem = styled(ListItem, {
  name: "BrutalistListItem",
  rounded: 0,
  borderWidth: 2,
  borderColor: "$gray5",
  bg: "$background",
  my: "$1",
  cursor: "pointer",

  hoverStyle: {
    bg: "$gray2",
    borderColor: "$gray7",
  },
  pressStyle: {
    bg: "$gray3",
    borderColor: "$gray8",
  },

  variants: {
    active: {
      true: {
        bg: "$purple2",
        borderColor: "$purple7",
        borderLeftWidth: 4,
        borderLeftColor: "$purple9",
      },
    },
    accent: {
      true: {
        borderLeftWidth: 4,
        borderLeftColor: "$purple9",
      },
    },
  } as const,
});
