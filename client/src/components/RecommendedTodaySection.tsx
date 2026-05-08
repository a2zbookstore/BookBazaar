import { Link } from "wouter";

interface RecommendedCard {
  title: string;
  subtitle: string;
  image: string;
  href: string;
}

interface RecommendedTodaySectionProps {
  cards?: RecommendedCard[];
}

const defaultCards: RecommendedCard[] = [
  {
    title: "BESTSELLERS",
    subtitle: "Discount up to 85% off – Latest model stock!",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    href: "/catalog?bestseller=true",
  },
  {
    title: "NEW ARRIVALS",
    subtitle: "Exclusive new collection with trending titles",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    href: "/catalog?newArrival=true",
  },
  {
    title: "FEATURED PICKS",
    subtitle: "Handpicked reads for every book lover!",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
    href: "/catalog?featured=true",
  },
];

export default function RecommendedTodaySection({
  cards = defaultCards,
}: RecommendedTodaySectionProps) {
  return (
    <section className="w-full mb-10 px-1">
      {/* Section heading */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Recommended Today
      </h2>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <div className="relative overflow-hidden rounded-xl cursor-pointer group aspect-[4/3]">
              {/* Background image */}
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Dark overlay — lighter at top, stronger at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

              {/* Text content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-white font-extrabold text-lg md:text-xl uppercase tracking-wide leading-tight">
                  {card.title}
                </p>
                <p className="text-white/85 text-sm mt-1 leading-snug">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
