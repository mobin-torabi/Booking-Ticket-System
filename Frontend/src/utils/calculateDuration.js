export default function calculateDuration(start, end) {

    const departure = new Date(start);

    const arrival = new Date(end);

    const diff = arrival - departure;

    const hours = Math.floor(diff / (1000 * 60 * 60));

    const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours}h ${minutes}m`;
}