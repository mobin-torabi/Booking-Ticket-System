export default function PageHeader({
    title,
    subtitle,
    actions,
}) {
    return (
        <div className="flex justify-between items-center mb-6 bg-blue-50">
            <div>
                <h1 className="text-3xl font-bold ">
                    {title}
                </h1>

                {subtitle && (
                    <p>{subtitle}</p>
                )}
            </div>

            {actions}
        </div>
    );
}