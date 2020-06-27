import { createMuiTheme } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#26A69A",
    },
    secondary: {
      main: "#90CAF9",
    },
    error: {
      main: "#ef5350",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

export default theme;
