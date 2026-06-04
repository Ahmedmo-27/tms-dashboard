"use client";
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
    <Pagination>
      <PaginationContent className="gap-1 sm:gap-2">
        <PaginationItem>
          <PaginationPrevious
            className="cursor-pointer touch-manipulation h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            onClick={() => {
              if (currentPage === 1) return;
              onPageChange(currentPage - 1);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            className="cursor-pointer touch-manipulation h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            onClick={() => {
              onPageChange(1);
            }}
          >
            {currentPage}
          </PaginationLink>
        </PaginationItem>
        <PaginationItem className="hidden sm:block">
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            className="cursor-pointer touch-manipulation h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
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
