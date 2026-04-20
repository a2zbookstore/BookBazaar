import React, { useState, useMemo, useEffect } from "react";
import { Button } from "./button";
import { X, Pen, Sparkles, Type } from "lucide-react";

import { GiftCategory } from "../../../../shared/schema";
import { Textarea } from "./textarea";

export interface EngraveFeatureProps {
    open: boolean;
    onClose: () => void;
    category: GiftCategory;
    onSubmit: () => void;
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
    const characterLimit = category.engravingCharacterLimit || 50;
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [isClosing, setIsClosing] = useState<boolean>(false);

    const allImages = useMemo(() => {
        const images: string[] = [];
        if (selectedItem?.images && selectedItem.images.length > 0) {
            images.push(...selectedItem.images);
        }
        if (selectedItem?.imageUrl) images.unshift(selectedItem.imageUrl);
        const catImages = [category.imageUrl, (category as any).imageUrl2, (category as any).imageUrl3].filter(Boolean) as string[];
        images.push(...catImages);
        return Array.from(new Set(images.filter(Boolean)));
    }, [selectedItem, category.imageUrl, (category as any).imageUrl2, (category as any).imageUrl3]);

    const [previewImage, setPreviewImage] = useState<string | undefined>(
        selectedItem?.imageUrl || selectedItem?.images?.[0] || category.imageUrl || (category as any).imageUrl2 || (category as any).imageUrl3
    );

    useEffect(() => {
        if (open && allImages.length > 0) {
            setPreviewImage(allImages[0]);
        }
    }, [open, allImages]);

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

    const handleClose = () => {
        setIsClosing(false);
        setIsVisible(false);
        onClose();
    };

    const handleSave = () => {
        onSubmit();
        handleClose();
    };

    useEffect(() => {
        if (open) {
            setIsVisible(true);
            setIsClosing(false);
        }
    }, [open]);

    const charPercent = Math.min((engravingMessage.length / characterLimit) * 100, 100);
    const isNearLimit = charPercent > 80;

    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-50 flex md:justify-end justify-center md:items-stretch items-end">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}></div>
            <div
                className={
                    `relative w-full md:max-w-md md:h-full h-[85vh] bg-white shadow-2xl flex flex-col md:rounded-none rounded-t-2xl overflow-hidden ` +
                    (isClosing ? "md:animate-slide-out-right animate-slide-down" : "md:animate-slide-in-right animate-slide-up")
                }
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-white/20 rounded-full p-1.5">
                            <Pen className="h-4 w-4 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Personalize Your Gift</h2>
                    </div>
                    <button
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Product Card */}
                    <div className="flex gap-4 items-start bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt={displayName}
                                className="w-20 h-24 object-cover rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-base text-gray-900 leading-tight mb-1 line-clamp-2">{displayName}</h3>
                            {displayDescription && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{displayDescription}</p>
                            )}
                            {typeof displayPrice === "number" && displayPrice > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-400 line-through">${displayPrice}</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">FREE</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {allImages.map((src) => (
                                <button
                                    key={src}
                                    type="button"
                                    onClick={() => setPreviewImage(src)}
                                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${previewImage === src
                                        ? "border-pink-500 shadow-md shadow-pink-200"
                                        : "border-transparent hover:border-gray-300"
                                        }`}
                                    aria-label="Select preview image"
                                >
                                    <img src={src} alt="Thumbnail" className="w-12 h-12 object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Engraving Toggle */}
                    <div
                        className={`rounded-xl border-2 transition-all duration-200 ${engraveEnabled
                            ? "border-pink-300 bg-gradient-to-br from-pink-50/80 to-purple-50/60 shadow-sm"
                            : "border-gray-200 bg-white"
                            }`}
                    >
                        <label
                            htmlFor="engrave-enabled"
                            className="flex items-center justify-between p-4 cursor-pointer select-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`rounded-full p-2 transition-colors ${engraveEnabled ? "bg-pink-100" : "bg-gray-100"}`}>
                                    <Sparkles className={`h-4 w-4 ${engraveEnabled ? "text-pink-600" : "text-gray-400"}`} />
                                </div>
                                <div>
                                    <span className="font-semibold text-sm text-gray-900 block">Add Engraving</span>
                                    <span className="text-xs text-gray-500">Personalize with a custom message</span>
                                </div>
                            </div>
                            {/* Toggle Switch */}
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={engraveEnabled}
                                    onChange={(e) => setEngraveEnabled(e.target.checked)}
                                    id="engrave-enabled"
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-pink-500 rounded-full transition-colors duration-200"></div>
                                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                            </div>
                        </label>

                        {/* Engraving Message Area */}
                        {engraveEnabled && (
                            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="relative">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Type className="h-3.5 w-3.5 text-gray-400" />
                                        <label htmlFor="engraving-message" className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Your Message
                                        </label>
                                    </div>
                                    <Textarea
                                        id="engraving-message"
                                        value={engravingMessage}
                                        maxLength={characterLimit}
                                        onChange={(e) => setEngravingMessage(e.target.value)}
                                        placeholder="e.g. To my dearest friend, Happy Birthday!"
                                        className="w-full border-gray-200 focus:border-pink-400 focus:ring-pink-300 rounded-lg px-3.5 py-3 min-h-[88px] text-sm placeholder:text-gray-300 resize-none"
                                    />
                                    {/* Character Counter */}
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-3">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${isNearLimit ? "bg-amber-400" : "bg-pink-400"
                                                    } ${charPercent >= 100 ? "bg-red-400" : ""}`}
                                                style={{ width: `${charPercent}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium tabular-nums ${isNearLimit ? "text-amber-600" : "text-gray-400"
                                            } ${charPercent >= 100 ? "text-red-500" : ""}`}>
                                            {engravingMessage.length}/{characterLimit}
                                        </span>
                                    </div>
                                </div>

                                {/* Live Preview */}
                                {engravingMessage.trim().length > 0 && (
                                    <div className="rounded-lg bg-white border border-dashed border-pink-200 p-3 animate-in fade-in duration-200">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 font-medium">Preview</p>
                                        <p className="text-sm text-gray-800 italic font-serif leading-relaxed break-words">
                                            "{engravingMessage}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/80">
                    <div className="flex gap-3">
                        <Button
                            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-200/50 font-semibold h-11"
                            onClick={handleSave}
                            disabled={engraveEnabled && engravingMessage.trim().length === 0}
                        >
                            {engraveEnabled && engravingMessage.trim().length > 0
                                ? 'Save & Continue'
                                : engraveEnabled
                                    ? 'Enter a message first'
                                    : 'Continue Without Engraving'}
                        </Button>
                        <Button
                            className="rounded-full h-11 px-5"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                    </div>
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
