export default function ErrorState({
    message = "مشکلی پیش آمده است.",
}) {
    return (
        <div className="text-center py-10">
            <h2>خطا</h2>

            <p>{message}</p>
        </div>
    );
}