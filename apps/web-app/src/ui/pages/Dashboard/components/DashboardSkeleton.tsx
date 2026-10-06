import React from 'react';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {/* Cuadro 1 */}
            <div className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6 h-32" />
            {/* Cuadro 2 */}
            <div className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6 h-32" />
            {/* Cuadro 3 */}
            <div className="animate-pulse rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 p-6 h-32" />
            
            {/* ELIMINAMOS EL CUARTO CUADRO QUE ESTABA AQUÍ ABAJO */}
        </div>
    );
};