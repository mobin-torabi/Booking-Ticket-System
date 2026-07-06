import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";

export default function Modal({
    open,
    title,
    children,
    actions,
    onClose,
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>{title}</DialogTitle>

            <DialogContent>{children}</DialogContent>

            <DialogActions>{actions}</DialogActions>
        </Dialog>
    );
}