import useDocumentTitle from "../../hooks/useDocumentTitle";

export default function NotFound() {
    useDocumentTitle("ERROR - 404")
    return <h1>404 - Page Not Found</h1>;
}