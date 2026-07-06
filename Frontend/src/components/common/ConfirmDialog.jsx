import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
    open,
    title = "Confirmation",
    message,
    onConfirm,
    onCancel,
}) {
    return (
        <Modal
            open={open}
            title={title}
            onClose={onCancel}
            actions={
                <>
                    <Button
                        variant="outlined"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>

                    <Button
                        color="error"
                        onClick={onConfirm}
                    >
                        Confirm
                    </Button>
                </>
            }
        >
            <p>{message}</p>
        </Modal>
    );
}