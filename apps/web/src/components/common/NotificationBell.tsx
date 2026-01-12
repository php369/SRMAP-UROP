import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XIcon } from '../ui/Icons';
import { useNotificationStore } from '../../stores/notificationStore';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface NotificationBellProps {
    variant?: 'default' | 'sidebar';
}

export function NotificationBell({ variant = 'default' }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification
    } = useNotificationStore();

    const unreadCount = getUnreadCount();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (id: string, read?: boolean) => {
        if (!read) {
            markAsRead(id);
        }
        // Logic to navigate if notification has data (e.g. windowId) can be added here
    };

    const isSidebar = variant === 'sidebar';

    // Shared popover content
    const popoverContent = (
        <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                {!isSidebar && (
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                )}
                {isSidebar && <div className="flex-1" />}
                {/* For sidebar, title is removed, but we keep button aligned appropriately or remove header? 
                    "the popover, shouldn't contain Notification title" 
                    If I remove H3, the mark all button will be alone. 
                    If sidebar, maybe align it end? 
                */}

                {unreadCount > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors ml-auto"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className={cn("overflow-y-auto", isSidebar ? "max-h-[50vh]" : "max-h-[60vh]")}>
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <BellIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">No notifications</p>
                        <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 hover:bg-slate-50 transition-colors relative group cursor-pointer",
                                    !notification.read ? "bg-blue-50/30" : ""
                                )}
                                onClick={() => handleNotificationClick(notification.id, notification.read)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                                        !notification.read ? "bg-blue-500" : "bg-transparent"
                                    )} />

                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-medium mb-0.5",
                                            !notification.read ? "text-slate-900" : "text-slate-600"
                                        )}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-2">
                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNotification(notification.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                        title="Remove"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    // Sidebar variant: Full-width row trigger with popover constrained to sidebar
    if (isSidebar) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center p-2 rounded-xl transition-all duration-200 text-left hover:bg-[#eeedeb]"
                    aria-label="Notifications"
                >
                    <div className="flex-shrink-0">
                        <div className="w-9 h-9 bg-[#e2e2e2] rounded-lg flex items-center justify-center relative">
                            <BellIcon className="w-5 h-5 text-slate-700" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        {unreadCount > 0 && (
                            <span className="text-xs text-slate-500">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                        >
                            {popoverContent}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default variant: Icon-only trigger (for mobile header)
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                aria-label="Notifications"
            >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden"
                    >
                        {popoverContent}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
