import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Heart, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";
import CountrySelector from "@/components/CountrySelector";
import { SiWhatsapp } from "react-icons/si";
import ProfileMenu from "./ui/profileMenu";
import CategoryMegaMenu from "@/components/CategoryMegaMenu";
import MobileCategoryDrawer from "@/components/MobileCategoryDrawer";

export default function Header() {
    const [location, setLocation] = useLocation();
    const { user, isAuthenticated, isLoading } = useAuth();
    const { cartCount, isCartAnimating, wishlistCount } = useGlobalContext();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
    const categoryMenuRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsScrolled(scrollY > 10);
            const header = document.querySelector('.fixed-header');
            if (header) {
                const height = header.getBoundingClientRect().height;
                document.documentElement.style.setProperty('--header-height', `${height}px`);
            }
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };

    }, []);

    useEffect(() => {
        if (!isCategoryMenuOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsCategoryMenuOpen(false);
        };
        const onMouseDown = (e: MouseEvent) => {
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
                setIsCategoryMenuOpen(false);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("mousedown", onMouseDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("mousedown", onMouseDown);
        };
    }, [isCategoryMenuOpen]);

    const isActive = (path: string) => {
        if (path === "/" && location === "/") return true;
        if (path !== "/" && location.startsWith(path)) return true;
        return false;
    };

    return (
        <header className={`fixed-header bg-white border-b border-gray-200 w-full transition-all duration-300 z-30 ${isScrolled ? 'header-shadow bg-white/95 backdrop-blur-sm' : ''}`}>
            <div className="container-custom px-3 md:px-6  ">
                {/* Top Row - Logo, Search, Right Actions */}
                <div className={`flex items-center justify-between w-full transition-all duration-300 h-16 md:h-22 `}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center flex-shrink-0">
                        <div className="md:hidden">
                            <Logo size="xl" variant="default" showText={true} />
                        </div>
                        <div className="hidden md:block">
                            <Logo size="2xl" variant="default" showText={true} />
                        </div>
                    </Link>
                    {/* Categories + Search — grouped together */}
                    <div className="hidden md:flex justify-center gap-2 items-center flex-1 max-w-xl mx-4 relative z-20">
                        <div className="relative flex-shrink-0 mt-1" ref={categoryMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsCategoryMenuOpen((open) => !open)}
                            aria-haspopup="true"
                            aria-expanded={isCategoryMenuOpen}
                            title="Categories"
                            className="flex items-center p-2 rounded-full  text-white bg-primary-aqua hover:bg-secondary-aqua transition-colors h-8"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        {isCategoryMenuOpen && (
                                <div className="absolute left-0 top-full mt-2 w-[90vw] max-w-5xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/[0.06] z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-5 sm:p-6 lg:p-8">
                                        <CategoryMegaMenu onNavigate={() => setIsCategoryMenuOpen(false)} />
                                    </div>
                                </div>
                        )}
                        </div>
                        <div className="flex-1">
                            <SearchInput
                                placeholder="Search Books, Authors, Publisher, Category, ISBN..."
                                className="w-full h-8 rounded-l-none"
                                enableTypingAnimation={true}
                                staticKeyword="Search "
                            />
                        </div>
                    </div>


                    <div className="flex items-center gap-2">
                        <a
                            href="https://wa.me/14145956843"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors px-2 py-1 rounded-lg hover:bg-green-50"
                        >
                            <SiWhatsapp className="h-5 w-5" />
                            <span className="hidden md:block text-sm font-medium">Chat with us</span>
                        </a>
                        {isAuthenticated && (
                            <Link
                                href="/wishlist"
                                className={`text-secondary-black hover:text-primary-aqua transition-colors relative ${isActive("/wishlist") ? "text-primary-aqua font-semibold" : ""}`}
                            >
                                <div className="flex items-center gap-[1px] md:gap-1 relative">

                                    <Heart className="md:h-5 md:w-5" />
                                    <span className="hidden md:block">Wishlist</span>
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        )}
                        <div className="hidden lg:flex items-center ml-2">
                            <CountrySelector compact={false} />

                        </div>



                        <Link
                            href="/cart"
                            className={`transition-colors relative mx-1 sm:mx-3 sm:p-2 rounded-lg hover:bg-primary-aqua/10 border border-transparent hover:border-primary-aqua/20 ${isCartAnimating ? "cart-pulse-animation" : "text-secondary-black hover:text-primary-aqua cart-normal"}`}
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-3 -right-3 sm:-top-1 sm:-right-1 bg-abe-red text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                                    {cartCount}
                                </span>
                            )}
                        </Link> 
                        {isLoading ? (
                            // Placeholder to prevent layout shift while auth resolves
                            <div className="w-20 h-9" />
                        ) : isAuthenticated ? (
                            <ProfileMenu user={user} />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setLocation('/login')}
                                    className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white rounded-full"
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => setLocation('/register')}
                                    className="bg-primary-aqua hover:bg-secondary-aqua rounded-full"
                                >
                                    Register
                                </Button>


                            </div>
                        )}
                    </div>
                </div>


                {/* Mobile Search Bar */}
                <div className="md:hidden pb-3 flex items-center w-full gap-2">
                    <CountrySelector className="flex-shrink-0" compact={true} />
                    <div className="flex-1 min-w-0">
                        <SearchInput
                            placeholder="Search books, authors, ISBN..."
                            className="w-full"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsMobileCategoryOpen(true)}
                        title="Browse Categories"
                        className="flex-shrink-0 flex items-center p-2 rounded-full bg-primary-aqua text-white hover:bg-secondary-aqua transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <MobileCategoryDrawer open={isMobileCategoryOpen} onClose={() => setIsMobileCategoryOpen(false)} />

            </div>
        </header>
    );
}
