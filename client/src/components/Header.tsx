import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { Button } from "@/components/ui/button";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";
import CountrySelector from "@/components/CountrySelector";
import { SiWhatsapp } from "react-icons/si";
import ProfileMenu from "./ui/profileMenu";

export default function Header() {
    const [location, setLocation] = useLocation();
    const { user, isAuthenticated } = useAuth();
    const { cartCount, isCartAnimating, wishlistCount } = useGlobalContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);


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

    const isActive = (path: string) => {
        if (path === "/" && location === "/") return true;
        if (path !== "/" && location.startsWith(path)) return true;
        return false;
    };

    return (
        <header className={`fixed-header bg-white border-b border-gray-200 w-full transition-all duration-300 z-30 ${isScrolled ? 'header-shadow bg-white/95 backdrop-blur-sm' : ''}`}>
            <div className="container-custom px-3 md:px-6">
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
                    {/* Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-6xl mx-8">
                        <SearchInput
                            placeholder="Search Books, Authors, Publisher, Category, ISBN..."
                            className="w-full h-8"
                            enableTypingAnimation={true}
                            staticKeyword="Search "
                        />
                    </div>
                    {/* Desktop Right Actions */}
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
                            className={`transition-colors relative mx-3 p-2 rounded-lg hover:bg-primary-aqua/10 border border-transparent hover:border-primary-aqua/20 ${isCartAnimating ? "cart-pulse-animation" : "text-secondary-black hover:text-primary-aqua cart-normal"}`}
                        >
                            <ShoppingCart className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-abe-red text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        {isAuthenticated ? (
                            <ProfileMenu user={user} />
                        ) : (
                            <div className="flex items-center space-x-2">
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
                    {/* Mobile Right Actions */}
                    {/* <div className="flex md:hidden items-center gap-3">
                        <Link
                            href="/cart"
                            className={`transition-colors relative p-2 rounded-lg hover:bg-primary-aqua/10 ${isCartAnimating ? "cart-pulse-animation" : "text-secondary-black hover:text-primary-aqua cart-normal"}`}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-abe-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div> */}
                </div>
                {/* Mobile Search Bar */}
                <div className="md:hidden px-3 pb-3">
                    <SearchInput
                        placeholder="Search books, authors, ISBN..."
                        className="w-full h-10"
                    />
                </div>
            </div>
        </header>
    );
}
