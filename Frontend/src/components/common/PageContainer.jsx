import { Box } from "@mui/material";

/**
 * The standard gutter + max-width every full-page screen sits in. Pages used
 * to set their own (`p: 1`, or a raw 10px inline style), which left the admin
 * tables jammed against the edge of wide screens while the public pages were
 * centred at 1100px — this keeps the two consistent.
 */
export default function PageContainer({ children, maxWidth = 1280 }) {
  return (
    <Box
      dir="rtl"
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        px: { xs: 2, md: 3 },
        py: { xs: 3, md: 5 },
      }}
    >
      {children}
    </Box>
  );
}
