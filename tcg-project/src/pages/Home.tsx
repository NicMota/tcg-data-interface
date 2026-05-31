import { useEffect, useState, type ChangeEvent } from 'react'
import axs from '../axios';
import { Card } from '../components/Card';

function Home() {

    const [cards, setCards] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [foil, setFoil] = useState<boolean | undefined>(undefined);

    useEffect(() => {

        const fetchCards = async () => {

            const { data } = await axs.get('/cards', {
                params: {
                    page: currentPage + 1,
                    limit: itemsPerPage,
                    name: search || undefined,
                    foil: foil !== undefined ? foil : undefined,
                },
            });

            setCards(data.data);
            setTotalPages(data.totalPages);
        };

        fetchCards();

    }, [currentPage, itemsPerPage, search, foil]);

    useEffect(() => {
        setCurrentPage(0);
    }, [search, foil]);

    function filterCards(e: ChangeEvent<HTMLInputElement>) {
        setSearch(e.target.value);
    }

    // Pagination window
    const visiblePages = 5;
    const half = Math.floor(visiblePages / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, start + visiblePages - 1);
    if (end - start < visiblePages - 1) start = Math.max(0, end - visiblePages + 1);

    function nextPage() { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); }
    function previousPage() { if (currentPage > 0) setCurrentPage(p => p - 1); }
    function goToPage(i: number) { if (i >= 0 && i < totalPages) setCurrentPage(i); }

    return (
        <div
            className="min-h-screen"
            style={{
                background: "#080710",
                color: "#ede8d8",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Ambient glow blobs */}
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <div style={{
                    position: "absolute",
                    top: "-15%",
                    right: "10%",
                    width: "600px",
                    height: "600px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.035) 0%, transparent 65%)",
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "10%",
                    left: "-5%",
                    width: "450px",
                    height: "450px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(100,60,180,0.04) 0%, transparent 70%)",
                }} />
            </div>

            {/* HEADER */}
            <header
                className="sticky top-0"
                style={{
                    zIndex: 50,
                    borderBottom: "1px solid rgba(212,175,55,0.12)",
                    background: "rgba(8,7,16,0.9)",
                    backdropFilter: "blur(20px)",
                }}
            >
                <div
                    className="max-w-7xl mx-auto px-6 flex items-center gap-6"
                    style={{ height: "72px" }}
                >
                    {/* Logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" stroke="#d4af37" strokeWidth="1.5" fill="none" opacity="0.8" />
                            <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" stroke="#d4af37" strokeWidth="0.8" fill="rgba(212,175,55,0.06)" />
                            <circle cx="14" cy="14" r="2.5" fill="#d4af37" opacity="0.9" />
                        </svg>
                        <h1
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: "18px",
                                fontWeight: "700",
                                letterSpacing: "0.2em",
                                background: "linear-gradient(135deg, #d4af37 0%, #f0d060 50%, #9b7e2c 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                whiteSpace: "nowrap",
                            }}
                        >
                            MAGIC TCG TRACKER
                        </h1>
                    </div>

                    {/* Decorative line */}
                    <div style={{
                        flex: 1,
                        height: "1px",
                        background: "linear-gradient(90deg, rgba(212,175,55,0.2), transparent)",
                    }} />

                    {/* Item count selector */}
                    <select
                        value={itemsPerPage}
                        onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(0); }}
                        style={{
                            background: "rgba(212,175,55,0.06)",
                            border: "1px solid rgba(212,175,55,0.18)",
                            borderRadius: "10px",
                            color: "#9b8c6e",
                            fontSize: "12px",
                            padding: "6px 10px",
                            outline: "none",
                            cursor: "pointer",
                        }}
                    >
                        <option value="20">20 / page</option>
                        <option value="30">30 / page</option>
                        <option value="40">40 / page</option>
                    </select>
                </div>
            </header>

            <div className="relative max-w-7xl mx-auto px-6 py-8" style={{ zIndex: 1 }}>

                {/* SEARCH BAR */}
                <div
                    className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center rounded-2xl p-4 mb-4"
                    style={{
                        background: "linear-gradient(160deg, #0f0e17 0%, #1a1628 100%)",
                        border: "1px solid rgba(212,175,55,0.15)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                    }}
                >
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={search}
                            onChange={filterCards}
                            placeholder="Search the archives..."
                            style={{
                                width: "100%",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(212,175,55,0.15)",
                                borderRadius: "12px",
                                padding: "11px 44px 11px 16px",
                                color: "#ede8d8",
                                fontSize: "14px",
                                outline: "none",
                                transition: "border-color 0.2s",
                                fontFamily: "'DM Sans', sans-serif",
                            }}
                            onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
                            onBlur={e => (e.target.style.borderColor = "rgba(212,175,55,0.15)")}
                        />
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            width="18" height="18" viewBox="0 0 18 18" fill="none"
                        >
                            <circle cx="8" cy="8" r="5.5" stroke="#6b6578" strokeWidth="1.5" />
                            <path d="M12.5 12.5L16 16" stroke="#6b6578" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>

                    {/* Foil filter pill */}
                    <button
                        onClick={() => { setFoil(foil ? undefined : true); setCurrentPage(0); }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "11px 18px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.08em",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border: foil
                                ? "1px solid rgba(212,175,55,0.5)"
                                : "1px solid rgba(212,175,55,0.18)",
                            background: foil
                                ? "rgba(212,175,55,0.15)"
                                : "rgba(212,175,55,0.04)",
                            color: foil ? "#d4af37" : "#6b6578",
                        }}
                    >
                        ✦ Foil
                    </button>

                    {/* Filters toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "11px 18px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.08em",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            border: showFilters
                                ? "1px solid rgba(212,175,55,0.5)"
                                : "1px solid rgba(212,175,55,0.18)",
                            background: showFilters
                                ? "rgba(212,175,55,0.1)"
                                : "rgba(212,175,55,0.04)",
                            color: showFilters ? "#d4af37" : "#9b8c6e",
                        }}
                    >
                        ⚙ Filters {showFilters ? "▴" : "▾"}
                    </button>
                </div>

                {/* FILTERS PANEL */}
                {showFilters && (
                    <div
                        className="rounded-2xl p-5 mb-4 flex flex-wrap gap-6 items-center"
                        style={{
                            background: "rgba(15,14,23,0.8)",
                            border: "1px solid rgba(212,175,55,0.12)",
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <label style={{ fontSize: "12px", letterSpacing: "0.08em", color: "#9b8c6e", textTransform: "uppercase" }}>
                                Mana Cost
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                style={{
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(212,175,55,0.15)",
                                    borderRadius: "8px",
                                    padding: "6px 12px",
                                    color: "#ede8d8",
                                    fontSize: "13px",
                                    width: "80px",
                                    outline: "none",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Status bar */}
                <div className="flex items-center justify-between mb-6">
                    <p style={{ fontSize: "12px", color: "#52525b", letterSpacing: "0.05em" }}>
                        Page {currentPage + 1} of {totalPages}
                    </p>
                    {search && (
                        <p style={{ fontSize: "12px", color: "#9b8c6e" }}>
                            Searching: <span style={{ color: "#d4af37" }}>"{search}"</span>
                        </p>
                    )}
                </div>

                {/* CARDS GRID */}
                {cards?.length > 0 ? (
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {cards.map((card: any) => (
                            <Card c={card} key={card.id} />
                        ))}
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center"
                        style={{ height: "50vh", gap: "16px" }}
                    >
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.3 }}>
                            <circle cx="24" cy="24" r="22" stroke="#d4af37" strokeWidth="1" />
                            <path d="M16 24 L24 16 L32 24 L24 32 Z" stroke="#d4af37" strokeWidth="1" fill="none" />
                            <circle cx="24" cy="24" r="3" fill="#d4af37" />
                        </svg>
                        <p style={{ color: "#52525b", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em", fontSize: "14px" }}>
                            No cards found
                        </p>
                    </div>
                )}

                {/* PAGINATION */}
                <div
                    className="flex justify-center items-center gap-2 flex-wrap"
                    style={{ marginTop: "48px", paddingBottom: "48px" }}
                >
                    <button
                        onClick={previousPage}
                        disabled={currentPage === 0}
                        style={{
                            padding: "9px 18px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.06em",
                            cursor: currentPage === 0 ? "not-allowed" : "pointer",
                            background: "rgba(212,175,55,0.05)",
                            border: "1px solid rgba(212,175,55,0.15)",
                            color: currentPage === 0 ? "#3a3530" : "#9b8c6e",
                            transition: "all 0.2s",
                        }}
                    >
                        ← Prev
                    </button>

                    {Array.from({ length: end - start + 1 }, (_, i) => {
                        const pageIndex = start + i;
                        const isActive = pageIndex === currentPage;
                        return (
                            <button
                                key={pageIndex}
                                onClick={() => goToPage(pageIndex)}
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    background: isActive
                                        ? "linear-gradient(135deg, #d4af37, #b8960c)"
                                        : "rgba(212,175,55,0.05)",
                                    border: isActive
                                        ? "1px solid #d4af37"
                                        : "1px solid rgba(212,175,55,0.15)",
                                    color: isActive ? "#080710" : "#6b6578",
                                    boxShadow: isActive ? "0 0 16px rgba(212,175,55,0.25)" : "none",
                                    fontFamily: "'Cinzel', serif",
                                }}
                            >
                                {pageIndex + 1}
                            </button>
                        );
                    })}

                    <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages - 1}
                        style={{
                            padding: "9px 18px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.06em",
                            cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                            background: "rgba(212,175,55,0.05)",
                            border: "1px solid rgba(212,175,55,0.15)",
                            color: currentPage === totalPages - 1 ? "#3a3530" : "#9b8c6e",
                            transition: "all 0.2s",
                        }}
                    >
                        Next →
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Home;