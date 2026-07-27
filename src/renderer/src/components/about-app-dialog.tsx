import SelfImprovementRounded from "@mui/icons-material/SelfImprovementRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";

const AboutDetail: FC<{ label: string; children: ReactNode }> = (props) => (
  <Box
    sx={{
      padding: 2.5,
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: (t) => t.palette.divider,
      borderRadius: 2.5,
      backgroundColor: (t) => t.palette.background.default,
    }}
  >
    <Typography
      variant="overline"
      sx={{
        display: "block",
        marginBottom: 0.5,
        color: (t) => t.palette.primary.main,
      }}
    >
      {props.label}
    </Typography>
    <Typography
      variant="body2"
      component="div"
      sx={{ color: (t) => t.palette.text.secondary }}
    >
      {props.children}
    </Typography>
  </Box>
);

export const AboutAppDialog: FC<{ open: boolean; onClose: () => unknown }> = (
  props,
) => {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center" }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              backgroundColor: (t) => t.palette.primary.main,
              color: (t) => t.palette.primary.contrastText,
            }}
          >
            <SelfImprovementRounded />
          </Box>
          <span>About YogaCorrect</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ paddingTop: 1 }}>
          <DialogContentText>
            YogaCorrect is a desktop yoga training app that helps users follow
            structured practice sessions, view exercise previews, track session
            time, and receive webcam-based pose feedback during workouts.
          </DialogContentText>

          <Stack spacing={1.5}>
            <AboutDetail label="Version">0.1.2</AboutDetail>

            <AboutDetail label="Core Features">
              Guided yoga routines, exercise previews, session timer, pause and
              resume controls, webcam pose tracking, feedback sounds, and
              progress review.
            </AboutDetail>

            <AboutDetail label="Built For">
              Home practice, beginner-friendly routines, posture awareness, and
              consistent daily movement.
            </AboutDetail>

            <AboutDetail label="Developer">YogaCorrect Team</AboutDetail>

            <AboutDetail label="Website">
              <Link
                href="about:blank"
                target="_blank"
                rel="noreferrer"
                underline="hover"
              >
                https://yogacorret.ai
              </Link>
            </AboutDetail>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={props.onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
