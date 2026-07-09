export default function EmptyState({
    title = "اطلاعاتی یافت نشد",
    description = "",
}) {
    return (
        <div className="text-center py-10">
            <h2>{title}</h2>

            <p>{description}</p>
        </div>
    );
}