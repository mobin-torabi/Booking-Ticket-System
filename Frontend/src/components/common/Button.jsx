import MuiButton from "@mui/material/Button";

export default function Button({
    children,
    variant = "contained",
    color = "primary",
    type = "button",
    fullWidth = false,
    disabled = false,
    startIcon,
    endIcon,
    onClick,
    className = "",
}) {
    return (
        <MuiButton
            variant={variant}
            color={color}
            type={type}
            fullWidth={fullWidth}
            disabled={disabled}
            startIcon={startIcon}
            endIcon={endIcon}
            onClick={onClick}
            className={className}
        >
            {children}
        </MuiButton>
    );
}