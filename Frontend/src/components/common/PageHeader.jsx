export default function PageHeader({
    title,
    subtitle,
    actions,
}) {
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold ">
                    {title}
                </h1>

                {subtitle && (
                    <p className="text-xl">{subtitle}</p>
                )}
            </div>

            {actions}
        </div>
    );
}