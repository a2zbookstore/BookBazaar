
import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { set } from "date-fns";

export default function BannerUploadPage() {
    const { toast } = useToast();
    const [pageName, setPageName] = useState("");

    const [bannerImages, setBannerImages] = useState(["", "", ""]);
    const [isUploading, setIsUploading] = useState([false, false, false]);
    const [isSaving, setIsSaving] = useState(false);
    const imageInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid File",
                description: "Please select an image file (PNG, JPG, etc.)",
                variant: "destructive",
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: "Image must be less than 5MB.",
                variant: "destructive",
            });
            return;
        }
        setIsUploading(prev => prev.map((v, i) => i === idx ? true : v));
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch("/api/banners/upload", {
                method: "POST",
                body: formData,
                credentials: "include"
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            setBannerImages(prev => prev.map((img, i) => i === idx ? data.imageUrl : img));
            // Store image info in DB

        } catch {
            toast({
                title: "Upload Failed",
                description: "There was an error uploading the image. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(prev => prev.map((v, i) => i === idx ? false : v));
        }
    };

    const handleSaveBanners = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const saveRes = await fetch("/api/banners", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image_urls: bannerImages.filter(Boolean),
                    page_type: pageName || "home",
                    is_active: true
                }),
                credentials: "include"
            });
            if (!saveRes.ok) throw new Error("Save failed");
            toast({
                title: "Upload Successful",
                description: `Image uploaded and saved!`,
            });
            setIsDialogOpen(false);
        } catch {
            alert("Failed to save banners");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!pageName) return;
        fetch(`/api/bannersbyName?page_type=${encodeURIComponent(pageName)}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setBannerImages(Array(5).fill("").map((_, i) => data[0].image_urls[i] || ""));
                } else {
                    setBannerImages(Array(5).fill(""));
                }
            })
            .catch(() => setBannerImages(Array(5).fill("")));
    }, [pageName]);

    return (
        <div className="p-8">
            <h2 className="text-xl font-bold mb-4">Upload Banner Images</h2>
            <div>
                <Label htmlFor="pageName">Page Name *</Label>
                {/* Combobox for selecting or adding page name */}
                <PageNameComboBox pageName={pageName} setPageName={setPageName} />
            </div>
            <form onSubmit={handleSaveBanners} className="space-y-6">
                {[0, 1, 2, 3, 4].map(idx => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <Label htmlFor={`bannerImage${idx}`} className="text-sm font-medium">
                            {idx === 0 ? "Primary Banner" : idx === 1 ? "Secondary Banner" : "Third Banner (optional)"}
                        </Label>
                        <div className="space-y-2 mt-2">
                            <div className="flex gap-2">
                                <Input
                                    id={`bannerImage${idx}`}
                                    type="text"
                                    value={bannerImages[idx]}
                                    onChange={e => setBannerImages(prev => prev.map((img, i) => i === idx ? e.target.value : img))}
                                    placeholder="https://res.cloudinary.com/... or upload below"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => imageInputRefs[idx]?.current?.click()}
                                    disabled={isUploading[idx]}
                                    className="whitespace-nowrap"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {isUploading[idx] ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
                            {bannerImages[idx] && (
                                <div className="w-32 h-20 border rounded overflow-hidden">
                                            <img
                                                src={bannerImages[idx]}
                                                alt={`Banner ${idx + 1} preview`}
                                                className="w-full h-full object-cover"
                                                onError={e => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "https://via.placeholder.com/300x100?text=No+Image";
                                                }}
                                            />
                                </div>
                            )}
                        </div>
                        <input
                            ref={imageInputRefs[idx]}
                            type="file"
                            accept="image/*"
                            onChange={e => handleImageUpload(e, idx)}
                            className="hidden"
                        />
                    </div>
                ))}
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" className="bg-primary-aqua hover:bg-secondary-aqua" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Banners"}
                    </Button>
                </div>
            </form>
        </div>
    );
}



// Combobox component for page names
interface PageNameComboBoxProps {
    pageName: string;
    setPageName: (name: string) => void;
}
function PageNameComboBox({ pageName, setPageName }: PageNameComboBoxProps) {
    const [options, setOptions] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>(pageName);
    const [isInput, setIsInput] = useState(false);

    useEffect(() => {
        fetch("/api/banner-page-types")
            .then(res => res.json())
            .then((pageTypes: string[]) => {
                setOptions(pageTypes);
            });
    }, []);

    useEffect(() => {
        if (inputValue && !options.includes(inputValue)) {
            setIsInput(true);
        } else {
            setIsInput(false);
        }
    }, [inputValue, options]);

    return (
        <div className="relative">
            {!isInput ? (
                <select
                    className="w-full border rounded px-2 py-1 mb-2"
                    value={options.includes(pageName) ? pageName : ""}
                    onChange={e => {
                        if (e.target.value !== "new") {
                            setPageName(e.target.value);
                            setIsInput(false);
                            setInputValue(e.target.value);
                        } else {
                            setIsInput(true);
                            setInputValue("");
                        }
                    }}
                >
                    <option value="" disabled>Select existing page...</option>
                    {options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="new">Add new Page</option>
                </select>
            ) : (
                <Input
                    id="pageNameInput"
                    value={inputValue}
                    placeholder="Or type new page name"
                    onChange={e => {
                        setInputValue(e.target.value);
                        setPageName(e.target.value);
                    }}
                    className="mt-1"
                    required
                />
            )}
        </div>
    );
}