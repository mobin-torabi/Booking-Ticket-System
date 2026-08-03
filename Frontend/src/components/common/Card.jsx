import { Card as MuiCard, CardContent } from "@mui/material";

export default function Card({ children, sx }) {
  return (
    // Cards are laid out in grids, so filling the track height keeps a row of
    // them the same size no matter how long each one's title wraps.
    <MuiCard
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "transform .18s ease, box-shadow .18s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 12px 28px rgba(6,83,196,.16)",
        },
        ...sx,
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: { xs: 2, sm: 2.5 },
          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
        }}
      >
        {children}
      </CardContent>
    </MuiCard>
  );
}
