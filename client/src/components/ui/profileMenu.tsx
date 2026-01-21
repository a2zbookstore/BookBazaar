import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";

import {
    User,
    ShoppingBag,
    Truck,
    Undo2,
    Phone,
    BookOpenCheck,
    LogOut,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

const menuItems = [
    { label: "Your Profile", icon: User, location: "/profile" },
    { label: "My Orders", icon: ShoppingBag, location: "/my-orders" },
    { label: "Track Order", icon: Truck, location: "/track-order" },
    { label: "Returns", icon: Undo2, location: "/returns" },
    { label: "Contact", icon: Phone, location: "/contact" },
    { label: "Request Book", icon: BookOpenCheck, location: "/request-book" },
];

export default function ProfileMenu(user?: any) {
    const [, setLocation] = useLocation();
    const [customerName, setCustomerName] = useState("");

    useEffect(() => {
        setCustomerName(user && (user.user.firstName || user.user.lastName)
            ? `${user.user.firstName.charAt(0).toUpperCase()}${user.user.lastName.charAt(0).toUpperCase()}`
            : "User");
    }, [user]);

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="group flex items-center gap-2 rounded-full focus:outline-none">
                    <Avatar
                        className="
                                inline-flex size-[45px]
                                select-none items-center justify-center
                                overflow-hidden rounded-full
                                bg-blackA1 align-middle
                                transition-all duration-300 ease-out
                                group-hover:scale-105
                                group-hover:shadow-lg
                                group-hover:ring-2
                                group-hover:ring-yellow-500">

                        <AvatarFallback
                            className="
                                flex size-full items-center justify-center
                                bg-primary-aqua
                                text-[15px] font-bold text-white"
                        >
                            {customerName}
                        </AvatarFallback>
                    </Avatar>
                </button>

            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="
                      z-50 mt-4
                      w-56 md:w-64 lg:w-72
                      rounded-xl bg-white p-2 md:p-3
                      shadow-lg ring-1 ring-black/5
                    "
                >
                    {menuItems.map(({ label, icon: Icon, location }) => (
                        <DropdownMenu.Item
                            key={label}
                            className="
                              flex cursor-pointer items-center gap-3 md:gap-4
                              rounded-xl
                              px-3 py-2 md:px-4 md:py-3
                              text-sm md:text-base
                              text-gray-700 outline-none
                              hover:bg-primary-aqua hover:text-white focus:bg-primary-aqua
                            focus:text-white
                            "
                            onClick={() => setLocation(location || "/")}
                        >
                            <Icon className="h-4 w-4 md:h-5 md:w-5" />
                            <span>{label}</span>
                        </DropdownMenu.Item>
                    ))}

                    <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />

                    <DropdownMenu.Item
                        className="
                          flex cursor-pointer items-center gap-3 rounded-xl
                          px-3 py-2 md:px-4 md:py-3
                          text-sm md:text-base
                          text-red-600 outline-none hover:text-white
                          hover:bg-red-500 hover:border-red-600
                        "
                        onClick={async () => {
                            try {
                                await fetch("/api/auth/logout", { method: "POST" });
                                window.location.href = "/";
                            } catch (error) {
                                window.location.href = "/api/logout";
                            }
                        }}
                    >
                        <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                        Logout
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
