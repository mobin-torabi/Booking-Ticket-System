export default function ErrorState({
    message = "Something went wrong.",
}) {
    return (
        <div className="text-center py-10">
            <h2>Error</h2>

            <p>{message}</p>
        </div>
    );
}