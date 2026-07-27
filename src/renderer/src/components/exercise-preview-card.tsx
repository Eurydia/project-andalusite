import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ExerciseData } from "@renderer/types";
import { type FC, useState } from "react";
import { DifficultyBadge } from "./difficulty-badge";
import { ExerciseDialog } from "./exercise-dialog";

export const ExercisePreviewCard: FC<{
  data: ExerciseData;
  onboarding: {
    shouldRun: boolean;
    onFinished: () => unknown;
  };
}> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          overflow: "hidden",
          boxShadow: "none",
        }}
      >
        <CardActionArea
          onClick={() => setDialogOpen(true)}
          disableTouchRipple
          disabled={props.data.soon}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
          }}
        >
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              backgroundColor: (t) => t.palette.primary.light,
            }}
          >
            <CardMedia
              component="img"
              image={props.data.thumbnailSrc}
              alt={`${props.data.name} pose preview`}
              sx={{
                objectFit: "cover",
                aspectRatio: "16/9",
                filter: props.data.soon ? "saturate(0.55)" : "none",
              }}
            />
            {props.data.soon && (
              <Chip
                label="COMING SOON"
                size="small"
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: (t) => t.palette.background.paper,
                  color: (t) => t.palette.primary.dark,
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              width: "100%",
              flexGrow: 1,
              padding: 2,
            }}
          >
            <Stack
              spacing={1.5}
              sx={{
                height: "100%",
                justifyContent: "space-between",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    color: (t) => t.palette.text.primary,
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {`${props.data.name}${props.data.soon ? " (coming soon!)" : ""}`}
                </Typography>
                {!props.data.soon && (
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 1.25,
                      backgroundColor: (t) => t.palette.background.default,
                      color: (t) => t.palette.primary.main,
                    }}
                  >
                    <ChevronRightRounded fontSize="small" />
                  </Box>
                )}
              </Stack>
              <DifficultyBadge variant={props.data.difficulty} />
            </Stack>
          </Box>
        </CardActionArea>
      </Card>
      {!props.data.soon && (
        <ExerciseDialog
          data={props.data}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onboarding={props.onboarding}
        />
      )}
    </>
  );
};
