export function removeEmptyValues(object) {
    return Object.fromEntries(
        Object.entries(object).filter(
            ([, value]) =>
                value !== "" &&
                value !== null &&
                value !== undefined
        )
    );
}

/* 
Example usage:

const filters = {
    origin: "Tehran",
    destination: "",
    seat_class: null,
    price_min: 500000,
};

const params = removeEmptyValues(filters);

Result:
{
    origin: "Tehran",
    price_min: 500000,
}

Using Axios:
ticketApi.getTickets(removeEmptyValues(filters));
*/