import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className=" fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-28 md:pt-32 p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full sm:w-[90vw] md:w-[700px] lg:w-[800px] h-[75vh] flex flex-col my-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header - Fixed */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 pr-2">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                    </button>
                </div>

                {/* Modal Content - Scrollable with Fixed Height */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-gray-700">
                    {children}
                </div>

            </div>
        </div>
    );
}
