import Box from "@mui/material/Box";
import type { FC } from "react";

export const View$VideoWindow: FC<{ url: string }> = (props) => {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        padding: { xs: 1, sm: 2 },
        backgroundColor: (t) => t.palette.primary.dark,
        backgroundImage: (t) =>
          `radial-gradient(circle at 10% 10%, ${t.alpha(t.palette.secondary.main, 0.22)}, ${t.alpha(t.palette.secondary.main, 0)} 32%), radial-gradient(circle at 90% 90%, ${t.alpha(t.palette.primary.light, 0.12)}, ${t.alpha(t.palette.primary.light, 0)} 34%)`,
      }}
    >
      <video
        src={props.url}
        style={{
          borderWidth: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
          borderRadius: 18,
        }}
        controls
        autoPlay
      >
        <source type="video/mp4" src={props.url} />
      </video>
    </Box>
  );
};
