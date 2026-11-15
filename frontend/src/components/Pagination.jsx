import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = (props) => {
  const currentPage = props.currentPage;
  const totalPages = props.totalPages;
  const totalCount = props.totalCount;
  const onPageChange = props.onPageChange;

  if (totalPages <= 1) {
    return null;
  }

  const pages = [];
  const maxVisiblePages = 5;
  let start = currentPage - 2;
  let end;

  if (start < 1) {
    start = 1;
  }

  end = start + maxVisiblePages - 1;
  if (end > totalPages) {
    end = totalPages;
  }

  if (end - start + 1 < maxVisiblePages) {
    start = end - maxVisiblePages + 1;
    if (start < 1) {
      start = 1;
    }
  }

  // Add the page numbers to the list.
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className="pagination-container" aria-label="Hotel list pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="page-btn"
        aria-label="Go to previous page"
      >
        <ChevronLeft size={18} />
      </button>

      {pages.map((pageNumber) => {
        let btnClass = 'page-btn';
        let current;

        if (currentPage === pageNumber) {
          btnClass = 'page-btn active';
          current = 'page';
        }

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={btnClass}
            aria-label={`Page ${pageNumber}`}
            aria-current={current}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="page-btn"
        aria-label="Go to next page"
      >
        <ChevronRight size={18} />
      </button>

      <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.5rem' }}>
        Total: {totalCount} hotels
      </span>
    </nav>
  );
};

export default Pagination;
