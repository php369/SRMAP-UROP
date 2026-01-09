export function FacultyDashboard() {


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Quick Actions Removed */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Reviews</h3>
                    <div className="text-center py-8 text-slate-400">
                        <p>No pending reviews</p>
                    </div>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
                    <div className="text-center py-8 text-slate-400">
                        <p>No recent activity</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
