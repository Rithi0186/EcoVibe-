export function CardSkeleton({ className = '' }) {
    return (
        <div className={`glass-card p-6 ${className}`}>
            <div className="skeleton h-4 w-3/4 mb-4" />
            <div className="skeleton h-3 w-1/2 mb-3" />
            <div className="skeleton h-3 w-5/6 mb-3" />
            <div className="skeleton h-3 w-2/3" />
        </div>
    )
}

export function StatSkeleton() {
    return (
        <div className="glass-card p-5">
            <div className="skeleton h-3 w-20 mb-3" />
            <div className="skeleton h-8 w-24 mb-2" />
            <div className="skeleton h-2 w-16" />
        </div>
    )
}

export function ListSkeleton({ rows = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="glass-card p-4 flex items-center gap-4">
                    <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1">
                        <div className="skeleton h-3 w-3/4 mb-2" />
                        <div className="skeleton h-2 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <div className="glass-card p-6">
            <div className="skeleton h-4 w-40 mb-6" />
            <div className="skeleton h-48 w-full rounded-xl" />
        </div>
    )
}
