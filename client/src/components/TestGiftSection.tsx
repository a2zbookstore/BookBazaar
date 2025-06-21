import React from "react";
import { motion } from "framer-motion";

export default function TestGiftSection() {
  return (
    <div className="py-16 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 shadow-xl border-b-4 border-green-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          🎁 SPECIAL GIFT OFFER! 🎁
        </h2>
        <p className="text-2xl text-gray-700 mb-6 font-semibold">
          Buy any book and get <span className="font-bold text-green-600 text-3xl">1 FREE Novel or Notebook</span> as a gift!
        </p>
        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-xl p-4 mb-6 shadow-lg inline-block">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🛒</div>
            <p className="text-orange-800 font-medium">
              Add any book to your cart to activate this special gift offer!
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
          {/* Sample gift items */}
          {['Novel 1', 'Novel 2', 'Novel 3', 'Notebook 1', 'Notebook 2', 'Notebook 3'].map((item, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-400 transition-all">
              <div className="aspect-square bg-gray-200 rounded mb-2"></div>
              <h3 className="font-medium text-sm">{item}</h3>
              <button className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                Select Gift
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}