import * as React from "react";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import RestoreIcon from "@mui/icons-material/Restore";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import LuggageIcon from "@mui/icons-material/Luggage";
import SubwayIcon from "@mui/icons-material/Subway";
import { TextField } from "@mui/material";
export default function SimpleBottomNavigation() {
  const [value, setValue] = React.useState(0);

  return (
    <Box sx={{ width: "70%",  mx: "auto",  }}>
      <BottomNavigation
         sx={{
      borderRadius: "20px",
      mt: 5
    }}
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      >
        <BottomNavigationAction
          label="هواپیما"
          icon={<AirplanemodeActiveIcon />}
        />
        <BottomNavigationAction label="قطار" icon={<SubwayIcon />} />
        <BottomNavigationAction label="اتوبوس" icon={<DirectionsBusIcon />} />
        <BottomNavigationAction label="تور" icon={<LuggageIcon />} />
      </BottomNavigation>

<TextField
  fullWidth
  label="مبدا (شهر)"
  variant="outlined"
  sx={{
    direction: "rtl",
    "& .MuiInputBase-input": {
      textAlign: "right",
    },
    "& .MuiInputLabel-root": {
      right: 14,
      left: "auto",
      transformOrigin: "top right",
    },
  }}
/>     
    </Box>
  );
}
