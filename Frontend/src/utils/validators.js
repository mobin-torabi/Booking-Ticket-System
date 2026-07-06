export const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PHONE_REGEX =
    /^09\d{9}$/;

export const PASSWORD_REGEX =
    /^.{8,}$/;

export function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

export function isValidPhone(phone) {
    return PHONE_REGEX.test(phone);
}

export function isValidPassword(password) {
    return PASSWORD_REGEX.test(password);
}