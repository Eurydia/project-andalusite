import ConstructionRounded from "@mui/icons-material/ConstructionRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import type { FC } from "react";

export const SettingsDialog: FC<{ open: boolean; onClose: () => unknown }> = (
  props,
) => {
  return (
    <Dialog fullWidth maxWidth="sm" open={props.open} onClose={props.onClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Stack
          spacing={2.5}
          sx={{ paddingTop: 1, alignItems: "flex-start" }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              backgroundColor: (t) => t.palette.secondary.light,
              color: (t) => t.palette.secondary.dark,
            }}
          >
            <ConstructionRounded />
          </Box>
          <DialogContentText>
            Hang on tight. This feature will be coming soon 😉
          </DialogContentText>
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
