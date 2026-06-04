import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
} from "../pagination";

interface MembersPaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  maxPages: number; // Total number of pages
}

export default function MembersPagination({ currentPage, onPageChange, maxPages }: MembersPaginationProps) {
  return (
    <Pagination className="justify-center sm:justify-end">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PaginationPrevious
            className={currentPage === 1 ? "pointer-events-none opacity-50 h-8 w-8 sm:h-10 sm:w-auto sm:px-4" : "cursor-pointer h-8 w-8 sm:h-10 sm:w-auto sm:px-4"}
            aria-disabled={currentPage === 1}
            onClick={() => {
              if (currentPage === 1) return;
              onPageChange(currentPage - 1);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => {
              onPageChange(1);
            }}
          >
            {currentPage}
          </PaginationLink>
        </PaginationItem>
        {maxPages > 1 && (
          <PaginationItem>
            <PaginationEllipsis className="h-8 w-8 sm:h-10 sm:w-10" />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            className={currentPage === maxPages ? "pointer-events-none opacity-50 h-8 w-8 sm:h-10 sm:w-auto sm:px-4" : "cursor-pointer h-8 w-8 sm:h-10 sm:w-auto sm:px-4"}
            aria-disabled={currentPage === maxPages}
            onClick={() => {
              if (currentPage === maxPages) return;
              onPageChange(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
