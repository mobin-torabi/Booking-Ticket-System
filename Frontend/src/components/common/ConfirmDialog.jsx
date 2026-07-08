import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
    open,
    title = "تایید عملیات",
    message,
    confirmText = "تایید",
    cancelText = "انصراف",
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
                        {cancelText}
                    </Button>

                    <Button
                        color="error"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </Button>
                </>
            }
        >
            <p>{message}</p>
        </Modal>
    );
}