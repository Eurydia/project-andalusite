import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const mindfulFontFamily =
  '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';

const baseTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2F4B3D",
      light: "#DCE5DD",
      dark: "#1D3027",
      contrastText: "#FFFDF7",
    },
    secondary: {
      main: "#B86F52",
      light: "#EED8CD",
      dark: "#814531",
      contrastText: "#FFFDF7",
    },
    background: {
      default: "#F5F1E8",
      paper: "#FFFCF6",
    },
    text: {
      primary: "#26322C",
      secondary: "#69736D",
    },
    divider: "#D7DED9",
    success: {
      main: "#4E735E",
    },
    warning: {
      main: "#C7854F",
    },
    error: {
      main: "#A85242",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: mindfulFontFamily,
    allVariants: {
      fontFamily: mindfulFontFamily,
      fontFeatureSettings: '"liga" 1, "kern" 1',
    },
    h1: {
      fontWeight: 400,
      letterSpacing: "-0.035em",
      lineHeight: 1,
    },
    h2: {
      fontWeight: 400,
      letterSpacing: "-0.025em",
      lineHeight: 1.05,
    },
    h3: {
      fontWeight: 400,
      letterSpacing: "-0.018em",
      lineHeight: 1.1,
    },
    h4: {
      fontWeight: 400,
      letterSpacing: "-0.012em",
      lineHeight: 1.15,
    },
    h5: {
      fontWeight: 400,
      letterSpacing: "-0.006em",
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "0.008em",
      lineHeight: 1.3,
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "0.008em",
      lineHeight: 1.4,
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: "0.014em",
      lineHeight: 1.4,
    },
    overline: {
      fontSize: "0.68rem",
      fontWeight: 700,
      letterSpacing: "0.16em",
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.035em",
    },
    body1: {
      fontSize: "1.025rem",
      letterSpacing: "0.004em",
      lineHeight: 1.75,
    },
    body2: {
      fontSize: "0.95rem",
      letterSpacing: "0.006em",
      lineHeight: 1.7,
    },
    caption: {
      letterSpacing: "0.018em",
      lineHeight: 1.5,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minWidth: 320,
          minHeight: "100vh",
          overflow: "hidden",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 36,
          paddingInline: 14,
          textTransform: "none",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundImage: "none",
          borderWidth: 1,
          borderStyle: "solid",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: mindfulFontFamily,
          fontSize: "1.5rem",
          padding: "20px 20px 10px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingInline: 20,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 20px 18px",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
          letterSpacing: "0.04em",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: "0.78rem",
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(baseTheme);
