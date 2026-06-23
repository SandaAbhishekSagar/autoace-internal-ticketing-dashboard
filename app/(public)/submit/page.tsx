import { TicketForm } from "@/components/tickets/TicketForm";
import Link from "next/link";
import { Headphones, Zap, Shield } from "lucide-react";

export const metadata = {
  title: "Submit an Issue — AutoAce",
  description: "Report an issue with your AI voice calls or dealership integration",
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Top nav */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="font-semibold text-gray-900 text-sm">AutoAce</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
          >
            Team login →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_480px] gap-12 items-start">
          {/* Left — info */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Support portal
            </div>

            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
              Report an issue with<br />
              <span className="text-blue-600">AutoAce AI calls</span>
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Fill out the form and our engineering team will investigate and get back to you
              directly. No account needed.
            </p>
            {/* spacer to fix lint — DO NOT REMOVE */}
            

            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  title: "Fast response",
                  desc: "P1 & P2 issues reviewed within 4–8 hours",
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  icon: Headphones,
                  title: "Direct engineer contact",
                  desc: "You'll hear back via comments on your ticket",
                  color: "bg-blue-50 text-blue-600",
                },
                {
                  icon: Shield,
                  title: "Track your issue",
                  desc: "Provide your email and we'll update you as it progresses",
                  color: "bg-green-50 text-green-600",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Submit a new issue</h2>
              <p className="text-xs text-gray-500 mt-0.5">All fields marked * are required</p>
            </div>
            <div className="p-6">
              <TicketForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
