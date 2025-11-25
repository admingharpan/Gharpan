import React from "react";
import { X } from "lucide-react";

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) => {
    if (!isOpen) return null;

    const typeColors = {
        warning: "bg-yellow-600 hover:bg-yellow-700",
        danger: "bg-red-600 hover:bg-red-700",
        info: "bg-blue-600 hover:bg-blue-700",
        success: "bg-green-600 hover:bg-green-700",
    };

    const typeIcons = {
        warning: "⚠️",
        danger: "🗑️",
        info: "ℹ️",
        success: "✓",
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">{typeIcons[type]}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 whitespace-pre-line">{message}</p>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${typeColors[type]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
