import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import type { ExerciseData } from "@renderer/types";
import type { FC } from "react";
import { ExercisePreviewCard } from "./exercise-preview-card";

export const ExerciseGroupDisplay: FC<{
  items: Array<ExerciseData>;
  idPrefix: string;
  onboarding: {
    shouldRun: boolean;
    onFinished: () => unknown;
  };
}> = (props) => (
  <Grid container spacing={{ xs: 1.5, md: 2 }}>
    {props.items.map((item, i) => {
      return (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={item.name}>
          <Box
            data-onboarding={`${props.idPrefix}-${i}`}
            sx={{ height: "100%" }}
          >
            <ExercisePreviewCard data={item} onboarding={props.onboarding} />
          </Box>
        </Grid>
      );
    })}
  </Grid>
);
