interface PaginacionProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export default function Paginacion({
  page,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginacionProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (page <= 3) {
        // Al inicio
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (page >= totalPages - 2) {
        // Al final
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // En el medio
        pages.push(1)
        pages.push('...')
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632]">
      {/* Información de resultados */}
      <div className="text-sm text-[#617589] dark:text-slate-400">
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <>
            Mostrando{' '}
            <span className="font-semibold text-[#111418] dark:text-white">
              {(page - 1) * itemsPerPage + 1}
            </span>{' '}
            a{' '}
            <span className="font-semibold text-[#111418] dark:text-white">
              {Math.min(page * itemsPerPage, totalItems)}
            </span>{' '}
            de <span className="font-semibold text-[#111418] dark:text-white">{totalItems}</span> resultados
          </>
        ) : (
          <>
            Página <span className="font-semibold text-[#111418] dark:text-white">{page}</span> de{' '}
            <span className="font-semibold text-[#111418] dark:text-white">{totalPages}</span>
          </>
        )}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            page === 1
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-[#101922] border border-[#e6e8eb] dark:border-slate-700 text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a2632]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-[#617589] dark:text-slate-400"
                >
                  ...
                </span>
              )
            }

            const pageNumber = pageNum as number
            return (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === pageNumber
                    ? 'bg-[#1173d4] text-white'
                    : 'bg-white dark:bg-[#101922] border border-[#e6e8eb] dark:border-slate-700 text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a2632]'
                }`}
              >
                {pageNumber}
              </button>
            )
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            page === totalPages
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              : 'bg-white dark:bg-[#101922] border border-[#e6e8eb] dark:border-slate-700 text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a2632]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

