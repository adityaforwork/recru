import { X, Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";

function timeAgo(date) {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchNotifs();
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const markAllRead = async () => {
    await fetch('http://localhost:5000/api/notifications/read-all', { method: 'PUT' });
    setNotifications(prev => prev.map(n => ({...n, is_read: 1 })));
  };

  const unreadCount = notifications.filter(n =>!n.is_read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity ${isOpen? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer - LEFT SIDE SE */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[calc(100vw-3rem)] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out ${isOpen? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="h-16 px-5 border-b flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllRead} className="p-1.5 hover:bg-gray-100 rounded-full" title="Mark all as read">
              <CheckCheck className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {loading && <p className="p-4 text-xs text-gray-400">Loading...</p>}

          {!loading && notifications.length === 0 && (
            <p className="p-8 text-center text-sm text-gray-400">No notifications yet</p>
          )}

          {notifications.map(n => (
            <div key={n.id} className={`p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-3 ${!n.is_read? 'bg-green-50/40' : ''}`}>
              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.is_read? 'bg-amber-500' : 'bg-transparent'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.description || n.desc}</p>
                <p className="text- text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}