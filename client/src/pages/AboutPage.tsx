import React from "react";
import { Shield, Truck, Heart } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about A2Z BOOKSHOP, your premier destination for rare, collectible, and contemporary books. Quality guaranteed, fast shipping, and exceptional customer service."
        keywords="about a2z bookshop, online bookstore, rare books, collectible books, book seller"
        url="https://a2zbookshop.com/about"
        type="website"
      />
      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: "About" }]} />

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="text-4xl font-bookerly font-bold text-base-black mb-6">
              About A<span className="text-red-500">2</span>Z BOOKSHOP
            </h1>
            <p className="text-lg text-secondary-black mb-6">
              Welcome to A<span className="text-red-500">2</span>Z BOOKSHOP, your premier destination for rare, collectible, and contemporary books. 
              Founded with a passion for literature and a commitment to connecting readers with extraordinary books, 
              we've been serving book lovers worldwide for over a decade.
            </p>
            <p className="text-secondary-black mb-6">
              Our carefully curated collection spans from first editions and signed copies to everyday reads, 
              ensuring that every book lover finds their perfect literary companion. We pride ourselves on 
              the quality of our books, accurate descriptions, and exceptional customer service.
            </p>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-aqua">1,200+</p>
                <p className="text-secondary-black">Books Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-aqua">4.8/5</p>
                <p className="text-secondary-black">Customer Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-aqua">50+</p>
                <p className="text-secondary-black">Countries Served</p>
              </div>
            </div>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
              alt="Cozy reading corner with vintage books"
              className="rounded-lg shadow-lg w-full h-auto"
            />
          </div>
        </div>

        {/* Our Mission */}
        <section className="bg-site-bg rounded-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bookerly font-bold text-base-black mb-4">Our Mission</h2>
            <p className="text-secondary-black max-w-2xl mx-auto text-lg">
              To preserve the beauty of physical books while making rare and wonderful literature 
              accessible to readers around the world. Every book has a story, and we're here to 
              help it find its next chapter.
            </p>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-16">
          <h2 className="text-3xl font-bookerly font-bold text-base-black text-center mb-8">
            Why Choose A<span className="text-red-500">2</span>Z BOOKSHOP?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary-aqua/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary-aqua" />
                </div>
                <h3 className="font-bookerly font-semibold text-base-black mb-2">Quality Guaranteed</h3>
                <p className="text-secondary-black">
                  Every book is carefully inspected and accurately described to ensure you receive exactly what you expect.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary-aqua/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary-aqua" />
                </div>
                <h3 className="font-bookerly font-semibold text-base-black mb-2">Fast & Secure Shipping</h3>
                <p className="text-secondary-black">
                  Your books are packaged with care and shipped quickly with full tracking and insurance.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary-aqua/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary-aqua" />
                </div>
                <h3 className="font-bookerly font-semibold text-base-black mb-2">Passionate Service</h3>
                <p className="text-secondary-black">
                  Our team of book lovers is here to help you find exactly what you're looking for.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                alt="Bookshop interior with warm lighting"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bookerly font-bold text-base-black mb-6">Our Story</h2>
              <p className="text-secondary-black mb-4">
                A<span className="text-red-500">2</span>Z BOOKSHOP was born from a simple belief: that books are more than just objects—they're 
                gateways to new worlds, repositories of knowledge, and companions for life's journey.
              </p>
              <p className="text-secondary-black mb-4">
                What started as a small collection has grown into a comprehensive library spanning every 
                genre and interest. We specialize in finding those hard-to-locate titles, first editions, 
                and unique books that make reading an adventure.
              </p>
              <p className="text-secondary-black">
                Today, we're proud to serve readers from around the globe, helping them discover their next 
                favorite book or complete their cherished collections.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-primary-aqua rounded-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bookerly font-bold mb-4">Have Questions?</h2>
          <p className="mb-6">
            We'd love to hear from you! Whether you're looking for a specific book or just want to chat about literature.
          </p>
          <Link href="/contact">
            <button className="bg-white text-primary-aqua px-8 py-3 rounded hover:bg-gray-100 transition-colors font-semibold">
              Get in Touch
            </button>
          </Link>
        </section>
      </div>
    </>
  );
}
