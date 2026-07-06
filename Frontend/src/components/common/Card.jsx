import { Card as MuiCard, CardContent } from "@mui/material";

export default function Card({ children }) {
    return (
        <MuiCard>
            <CardContent>{children}</CardContent>
        </MuiCard>
    );
}