import Whatshot from "@mui/icons-material/Whatshot";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import type { FC } from "react";

export const DifficultyBadge: FC<{
  variant: "BASIC" | "INTERMEDIATE" | "ADVANCED";
}> = (props) => {
  const flameCount =
    props.variant === "BASIC" ? 1 : props.variant === "INTERMEDIATE" ? 2 : 3;

  return (
    <Chip
      size="small"
      label={
        <Stack
          direction="row"
          useFlexGap
          spacing={0.25}
          sx={{ flexWrap: "nowrap", alignItems: "center" }}
        >
          {Array.from({ length: flameCount }, (_, index) => (
            <Whatshot key={index} sx={{ fontSize: 16 }} />
          ))}
          <Box component="span" sx={{ marginLeft: 0.5 }}>
            {props.variant}
          </Box>
        </Stack>
      }
      sx={(t) => {
        if (props.variant === "BASIC") {
          return {
            backgroundColor: t.palette.primary.light,
            color: t.palette.primary.dark,
          };
        }

        if (props.variant === "INTERMEDIATE") {
          return {
            backgroundColor: t.palette.secondary.light,
            color: t.palette.secondary.dark,
          };
        }

        return {
          backgroundColor: t.palette.primary.dark,
          color: t.palette.primary.contrastText,
        };
      }}
    />
  );
};
