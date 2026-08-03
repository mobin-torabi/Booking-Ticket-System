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
  // `size`, `sx`, `component`/`to` and aria attributes used to be dropped
  // silently here, which is why call sites reached for `className="!h-14"`
  // escape hatches to size a button.
  ...rest
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
      {...rest}
    >
      {children}
    </MuiButton>
  );
}
