import MuiPagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

export default function Pagination({
    page,
    count,
    onChange,
}) {
    return (
        <Stack
            spacing={2}
            alignItems="center"
            mt={4}
        >
            <MuiPagination
                page={page}
                count={count}
                onChange={onChange}
                color="primary"
            />
        </Stack>
    );
}