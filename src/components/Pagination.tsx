import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleFirstPage = () => {
    if (canGoPrevious) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (canGoNext) {
      onPageChange(totalPages);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {/* Primeira página << */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleFirstPage}
        disabled={!canGoPrevious}
        className="h-9 w-9"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Página anterior < */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousPage}
        disabled={!canGoPrevious}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Número da página atual */}
      <div className="flex items-center px-4 py-2 text-sm">
        <span className="font-medium">
          {currentPage} de {totalPages}
        </span>
      </div>

      {/* Próxima página > */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextPage}
        disabled={!canGoNext}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Última página >> */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleLastPage}
        disabled={!canGoNext}
        className="h-9 w-9"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 