import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import type { FC } from "react";

export const AboutAppDialog: FC<{ open: boolean; onClose: () => unknown }> = (
  props,
) => {
  return (
    <>
      <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
        <DialogTitle>About YogaCorrect</DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              YogaCorrect is a desktop yoga training app that helps users follow
              structured practice sessions, view exercise previews, track
              session time, and receive webcam-based pose feedback during
              workouts.
            </DialogContentText>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Version</Typography>
              <Typography variant="body2" color="text.secondary">
                0.1.2
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Core Features</Typography>
              <Typography variant="body2" color="text.secondary">
                Guided yoga routines, exercise previews, session timer, pause
                and resume controls, webcam pose tracking, feedback sounds, and
                progress review.
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Built For</Typography>
              <Typography variant="body2" color="text.secondary">
                Home practice, beginner-friendly routines, posture awareness,
                and consistent daily movement.
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Developer</Typography>
              <Typography variant="body2" color="text.secondary">
                YogaCorrect Team
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Website</Typography>
              <Link
                href="about:blank"
                target="_blank"
                rel="noreferrer"
                underline="hover"
              >
                https://yogacorret.ai
              </Link>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={props.onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
