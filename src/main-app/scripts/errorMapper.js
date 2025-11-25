
const ERROR_UNKNOWN = "Unknown error.";

const statusMap = {
    400: "Invalid request.",
    401: "Unauthorized. Please check your credentials.",
    403: "Access denied.",
    404: "Resource not found.",
    409: "Conflict. The request cannot be completed.",
    429: "Too many requests. Please try again later.",
    500: "Internal server error. Please try again later.",
    503: "Service unavailable. Please try again later.",
};

export const ErrorScenario = Object.freeze({
    LOGIN: "Login",
    REGISTER: "Register",
    GENERIC: "Generic",
})

export function mapApiError(error, scenario=ErrorScenario.GENERIC) {
    if (!error) return ERROR_UNKNOWN

    if (typeof error === "object") {
        const status = error.status;
        const msg = error.message?.trim();

        if (scenario === ErrorScenario.LOGIN) {
            if (status === 400) {
                return "Incorrect email format, please correct email address.";
            }
            if (status === 401) {
                return "Incorrect email and/or password. Please correct your credentials.";
            }
        }  else if (scenario === ErrorScenario.REGISTER) {
            if (status === 409) {
                return "Email already exists. Change email or sign in.";
            }
        }

        if (status && statusMap[status]) {
            return statusMap[status];
        }

        if (msg) return msg;

        return ERROR_UNKNOWN;
    }

    if (typeof error === "string") return error;

    return ERROR_UNKNOWN;
}