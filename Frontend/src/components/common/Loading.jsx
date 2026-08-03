import { Stack, Typography } from "@mui/material";

import Spinner from "./Spinner";

export default function Loading({ message = "درحال بارگذاری..." }) {
  return (
    <Stack
      spacing={2}
      sx={{ alignItems: "center", justifyContent: "center", py: 8, px: 2 }}
    >
      <Spinner />

      <Typography sx={{ color: "text.secondary" }}>{message}</Typography>
    </Stack>
  );
}
