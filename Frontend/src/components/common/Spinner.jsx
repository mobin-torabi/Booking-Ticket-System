import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function Spinner() {
    return (
        <Box
            display="flex"
            justifycontent="center"
            alignitems="center"
            p={3}
        >
            <CircularProgress />
        </Box>
    );
}