const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            flexWrap: 'wrap'
        }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: currentPage === 1 ? '#f5f5f5' : 'white',
                    color: currentPage === 1 ? '#999' : '#333',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                        e.target.style.backgroundColor = '#f0f0f0';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                        e.target.style.backgroundColor = 'white';
                    }
                }}
            >
                ← Trước
            </button>
            
            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            color: '#333',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        1
                    </button>
                    {startPage > 2 && <span style={{ padding: '0 4px' }}>...</span>}
                </>
            )}
            
            {pages.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    style={{
                        padding: '8px 12px',
                        border: page === currentPage ? '2px solid #475569' : '1px solid #ddd',
                        borderRadius: '6px',
                        background: page === currentPage ? 'linear-gradient(135deg, #475569 0%, #334155 100%)' : 'white',
                        color: page === currentPage ? 'white' : '#333',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: page === currentPage ? '600' : '400',
                        transition: 'all 0.2s',
                        minWidth: '40px'
                    }}
                    onMouseEnter={(e) => {
                        if (page !== currentPage) {
                            e.target.style.backgroundColor = '#f0f0f0';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (page !== currentPage) {
                            e.target.style.backgroundColor = 'white';
                        }
                    }}
                >
                    {page}
                </button>
            ))}
            
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span style={{ padding: '0 4px' }}>...</span>}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            backgroundColor: 'white',
                            color: '#333',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {totalPages}
                    </button>
                </>
            )}
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: currentPage === totalPages ? '#f5f5f5' : 'white',
                    color: currentPage === totalPages ? '#999' : '#333',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                        e.target.style.backgroundColor = '#f0f0f0';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                        e.target.style.backgroundColor = 'white';
                    }
                }}
            >
                Sau →
            </button>
        </div>
    );
};

export default Pagination;

