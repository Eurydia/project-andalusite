import Whatshot from "@mui/icons-material/Whatshot";
import { Stack } from "@mui/material";
import Chip from "@mui/material/Chip";
import type { FC } from "react";

export const DifficultyBadge: FC<{
  variant: "BASIC" | "INTERMEDIATE" | "ADVANCED";
}> = (props) => {
  switch (props.variant) {
    case "BASIC":
      return <Chip icon={<Whatshot />} label="BASIC" color="warning" />;
    case "INTERMEDIATE":
      return (
        <Chip
          icon={
            <Stack direction="row" useFlexGap sx={{ flexWrap: "nowrap" }}>
              <Whatshot />
              <Whatshot />
            </Stack>
          }
          label="INTERMEDIATE"
          color="error"
        />
      );
    case "ADVANCED":
    default:
      return (
        <Chip
          color="secondary"
          icon={
            <Stack direction="row" useFlexGap sx={{ flexWrap: "nowrap" }}>
              <Whatshot />
              <Whatshot />
              <Whatshot />
            </Stack>
          }
          label="ADVANCED"
        />
      );
  }
};
