import React, { useState, useMemo, useEffect } from "react";
import { Button } from "./button";
import { X, Edit } from "lucide-react";

import { GiftCategory } from "../../../../shared/schema";
import { Textarea } from "./textarea";
import { on } from "events";

export interface EngraveFeatureProps {
    open: boolean;
    onClose: () => void;
    category: GiftCategory;
    onSubmit: () => void;
    // Optional: pass the full selected item data so we can show images
    selectedItem?: {
        name?: string;
        description?: string;
        price?: number;
        imageUrl?: string;
        images?: string[];
    };
    engraveEnabled: boolean;
    setEngraveEnabled: (enabled: boolean) => void;
    engravingMessage: string;
    setEngravingMessage: (message: string) => void;
}

export default function EngraveFeature({ open, onClose, category, onSubmit, selectedItem, engraveEnabled, setEngraveEnabled, engravingMessage, setEngravingMessage }: EngraveFeatureProps) {
    //   const [engraveEnabled, setEngraveEnabled] = useState(true);
    //   const [engravingMessage, setEngravingMessage] = useState("");
    const characterLimit = category.engravingCharacterLimit || 50;
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);

    // Compute image sources from selected item (preferred) or category.
    const allImages = useMemo(() => {
        const images: string[] = [];
        if (selectedItem?.images && selectedItem.images.length > 0) {
            images.push(...selectedItem.images);
        }
        // Prefer selectedItem primary image at the front
        if (selectedItem?.imageUrl) images.unshift(selectedItem.imageUrl);
        // Append category images (supports up to 3 image fields)
        const catImages = [category.imageUrl, (category as any).imageUrl2, (category as any).imageUrl3].filter(Boolean) as string[];
        images.push(...catImages);
        // De-duplicate while preserving order
        return Array.from(new Set(images.filter(Boolean)));
    }, [selectedItem, category.imageUrl, (category as any).imageUrl2, (category as any).imageUrl3]);

    const [previewImage, setPreviewImage] = useState<string | undefined>(
        selectedItem?.imageUrl || selectedItem?.images?.[0] || category.imageUrl || (category as any).imageUrl2 || (category as any).imageUrl3
    );

    // Keep preview synced when images change and panel opens
    useEffect(() => {
        if (open && allImages.length > 0) {
            setPreviewImage(allImages[0]);
        }
    }, [open, allImages]);

    // Prevent background scroll when panel is open
    useEffect(() => {
        if (isVisible) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [isVisible]);

    const displayName = selectedItem?.name || category.name;
    const displayDescription = selectedItem?.description || category.description;
    const displayPrice = selectedItem?.price ?? category.price;

    // Handle close animation
    const handleClose = () => {
        setIsClosing(false);
        setIsVisible(false);
        onClose();
    };

    // Handle mount/unmount with exit animation when `open` toggles
    useEffect(() => {
        if (open) {
            setIsVisible(true);
            setIsClosing(false);
        }
    }, [open]);

    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-50 flex md:justify-end justify-center md:items-stretch items-end">
            <div className="fixed inset-0 bg-black/30" onClick={onClose}></div>
            <div
                className={
                    `relative w-full md:max-w-md md:h-full h-[85vh] bg-white shadow-xl p-6 md:p-8 flex flex-col md:rounded-none rounded-t-2xl ` +
                    (isClosing ? "md:animate-slide-out-right animate-slide-down" : "md:animate-slide-in-right animate-slide-up")
                }
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    <X className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <Edit className="h-6 w-6 text-pink-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Customize Your Gift</h2>
                </div>
                {/* Preview image and details */}
                <div className="mb-4 md:mb-6 grid grid-cols-1 md:grid-cols-[120px,1fr] gap-4 items-start">
                    <div className="flex md:block justify-center">
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt={displayName}
                                className="w-32 h-40 md:w-28 md:h-36 object-cover rounded-lg border shadow"
                            />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-xl text-gray-800 mb-1">{displayName}</h3>
                        {displayDescription && (
                            <p className="text-sm text-gray-600 mb-2">{displayDescription}</p>
                        )}
                        {typeof displayPrice === "number" && (
                            <span className="text-xs text-pink-600 font-bold">Worth: ${displayPrice}</span>
                        )}
                        {/* Thumbnails (horizontal scroll on mobile) */}
                        {allImages.length > 1 && (
                            <div className="mt-3">
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {allImages.map((src) => (
                                        <button
                                            key={src}
                                            type="button"
                                            onClick={() => setPreviewImage(src)}
                                            className={`flex-shrink-0 rounded-md border ${previewImage === src ? "border-pink-500" : "border-gray-300"} focus:outline-none focus:ring-2 focus:ring-pink-400`}
                                            aria-label="Select preview image"
                                        >
                                            <img src={src} alt="Thumbnail" className="w-14 h-14 object-cover rounded-md" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mb-4">
                    <div className="flex  items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            checked={engraveEnabled}
                            onChange={(e) => setEngraveEnabled(e.target.checked)}
                            id="engrave-enabled"
                            className="accent-pink-500 scale-50 sm:scale-100 flex-shrink-0 w-[10%] sm:w-[15%]"
                        />
                        <label htmlFor="engrave-enabled" className="font-medium text-gray-700">Enable Engraving</label>
                    </div>
                    {engraveEnabled && (
                        <div>
                            <label htmlFor="engraving-message" className="block text-sm font-medium text-gray-700 mb-1">Engraving Message</label>
                            <Textarea
                                id="engraving-message"
                                // type="text"
                                value={engravingMessage}
                                maxLength={characterLimit}
                                onChange={(e) => setEngravingMessage(e.target.value)}
                                placeholder={`Enter message (max ${characterLimit} chars)`}
                                className="w-full border border-pink-300 rounded-md px-3 py-2 min-h-[96px]"
                            />
                            <div className="text-xs text-gray-500 mt-1 text-right">
                                {engravingMessage.length}/{characterLimit} characters
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                    <Button
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:from-pink-600 hover:to-purple-600"
                        onClick={handleClose}
                        disabled={engraveEnabled && engravingMessage.length === 0}
                    >
                        {engraveEnabled ? 'Save Preference' : 'Select Gift'}
                    </Button>
                    <Button className="rounded-full" variant="outline" onClick={handleClose}>Cancel</Button>
                </div>
            </div>
            <style>{`
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slide-out-right { animation: slide-out-right 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slide-out-right { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        @keyframes slide-down { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }
      `}</style>
        </div>
    );
}
