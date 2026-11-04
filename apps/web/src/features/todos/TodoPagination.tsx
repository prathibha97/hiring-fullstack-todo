import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Fragment } from 'react';
import type { TodoPage } from './todo.api';

type Props = {
  pagination: TodoPage['pagination'];
  busy: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function TodoPagination({
  pagination,
  busy,
  onPageChange,
  onLimitChange,
}: Props) {
  const { page, limit, total, totalPages } = pagination;
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const linkProps = (target: number) => {
    const disabled = busy || target < 1 || target > totalPages;
    return {
      href: '#tasks',
      'aria-disabled': disabled,
      tabIndex: disabled ? -1 : 0,
      className: disabled ? 'pointer-events-none opacity-40' : undefined,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (!disabled && target !== page) onPageChange(target);
      },
    };
  };

  return (
    <div className='pagination-footer'>
      <div className='pagination-meta'>
        <p role='status'>
          {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)}{' '}
          of {total}
        </p>
        <label className='page-size-label'>
          Per page
          <select
            aria-label='Tasks per page'
            value={limit}
            disabled={busy}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Pagination
        aria-label='Task pagination'
        className='mx-0 w-auto justify-start sm:justify-end'
      >
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious {...linkProps(page - 1)} />
          </PaginationItem>
          {pages.map((value, index) => (
            <Fragment key={value}>
              {index > 0 && value - pages[index - 1]! > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  {...linkProps(value)}
                  isActive={value === page}
                  aria-label={`Page ${value}`}
                  size='icon-sm'
                >
                  {value}
                </PaginationLink>
              </PaginationItem>
            </Fragment>
          ))}
          <PaginationItem>
            <PaginationNext {...linkProps(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
