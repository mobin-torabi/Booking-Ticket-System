import { useMemo, useState } from "react";

export default function usePagination(data = [], rowsPerPage = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const currentData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;

    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

  return {
    page,
    setPage,
    totalPages,
    currentData,
  };
}
