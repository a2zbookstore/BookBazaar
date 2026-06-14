import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";

interface MobileCategoryDrawerProps {
    open: boolean;
    onClose: () => void;
}

export default function MobileCategoryDrawer({ open, onClose }: MobileCategoryDrawerProps) {

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const handleNavigate = () => onClose();

    const drawer = (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-[998] bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-[999] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out flex flex-col ${open ? "translate-y-0" : "translate-y-full"}`}
                style={{ maxHeight: "85dvh" }}
                role="dialog"
                aria-modal="true"
                aria-label="Browse Categories"
            >
                {/* Handle + close */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Category mega menu — mobile layout */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
                    <CategoryMegaMenu mobile onNavigate={handleNavigate} />
                </div>
            </div>
        </>
    );

    return createPortal(drawer, document.body);
}

