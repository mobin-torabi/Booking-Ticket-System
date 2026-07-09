import Spinner from "./Spinner";

export default function Loading({
    message = "درحال بارگذاری...",
}) {
    return (
        <div className="text-center py-10">
            <Spinner />
            <p>{message}</p>
        </div>
    );
}