import { TicketForm } from "@/components/tickets/TicketForm";
import Link from "next/link";

export const metadata = {
  title: "Submit an Issue — AutoAce",
  description: "Report an issue with your AI voice calls or dealership integration",
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-[560px] mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
          <p className="text-gray-500 mt-2">
            Something not working right? Tell us what happened and we&apos;ll get on it.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <TicketForm />
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            On the team?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>{" "}
            to track your submissions.
          </p>
        </div>
      </div>
    </div>
  );
}
