import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const AboutSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=600&fit=crop"
                alt="A2Z Bookshop collection"
                className="rounded-2xl shadow-lg w-full h-80 object-cover"
              />
              <div className="flex flex-col gap-4">
                <img
                  src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&h=300&fit=crop"
                  alt="A2Z Bookshop books"
                  className="rounded-2xl shadow-lg w-full h-36 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500&h=320&fit=crop"
                  alt="A2Z Bookshop library"
                  className="rounded-2xl shadow-lg w-full h-40 object-cover"
                />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-4xl font-bookerly font-bold text-base-black mb-6">
              Why Choose A<span className="text-red-500">2</span>Z BOOKSHOP?
            </h3>
            <p className="text-lg text-secondary-black mb-8 leading-relaxed">
              We're passionate about connecting readers with extraordinary books. Our carefully
              curated collection spans from rare first editions to contemporary bestsellers,
              ensuring every book lover finds their perfect literary companion.
            </p>
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-aqua rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">1K+</span>
                </div>
                <div>
                  <p className="font-semibold text-base-black">Books Available</p>
                  <p className="text-secondary-black text-sm">Curated collection of quality books</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">4.8</span>
                </div>
                <div>
                  <p className="font-semibold text-base-black">Customer Rating</p>
                  <p className="text-secondary-black text-sm">Trusted by thousands of readers</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">50+</span>
                </div>
                <div>
                  <p className="font-semibold text-base-black">Countries Served</p>
                  <p className="text-secondary-black text-sm">Worldwide shipping available</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Link href="/about">
                <Button variant="outline" className="border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white px-8 py-3 rounded-full">
                  Learn More About Us
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="bg-primary-aqua hover:bg-secondary-aqua text-white px-8 py-3 rounded-full">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
