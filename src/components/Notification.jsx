import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
const Notification = ({ notification }) => {
    return (
        <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white transition-all duration-300 animate-in ${notification.type === 'success'
                ? 'bg-green-500'
                : notification.type === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
        >
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'error' && <AlertCircle size={20} />}
            {notification.type === 'info' && <XCircle size={20} />}
            <span className="font-medium">{notification.message}</span>
        </div>
    )
}
export default Notification;