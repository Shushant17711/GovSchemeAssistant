import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="flex flex-col items-center gap-10 py-12 text-center">
      <div className="rounded-full bg-brand-100 p-4">
        <Sparkles className="h-10 w-10 text-brand-600" />
      </div>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Which government schemes are you eligible for?
        </h1>
        <p className="text-lg text-gray-600">
          Answer a few simple questions and get a personalized list of central government schemes you may
          qualify for — explained simply, in your language.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow hover:bg-brand-700"
        >
          Find my schemes <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/browse"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          <Search className="h-4 w-4" /> Browse all schemes
        </Link>
      </div>
    </div>
  );
}
