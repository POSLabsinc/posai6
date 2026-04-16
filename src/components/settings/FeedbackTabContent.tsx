import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Frown, Smile } from "lucide-react";
import { format } from "date-fns";

// Platform logos
import googleLogo from "@/assets/icons/feedback-google.svg";
import yelpLogo from "@/assets/icons/feedback-yelp.svg";
import eatosLogo from "@/assets/icons/posai-logo.png";
import orderosLogo from "@/assets/icons/orderos-logo.png";

interface FeedbackItem {
  id: string;
  feedback_date: string;
  sentiment: string;
  comment: string;
  platform: string;
}

interface FeedbackTabContentProps {
  guest: { id: string; name: string };
}

const platformLogos: Record<string, { src?: string; text?: string; textClass?: string }> = {
  google: { src: googleLogo },
  eatos: { src: eatosLogo },
  yelp: { src: yelpLogo },
  zagat: { text: "ZAGAT", textClass: "text-red-500 font-bold text-lg tracking-wider" },
  orderos: { src: orderosLogo },
};

const FeedbackTabContent = ({ guest }: FeedbackTabContentProps) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("guest_feedback")
        .select("id, feedback_date, sentiment, comment, platform")
        .eq("guest_id", guest.id)
        .order("feedback_date", { ascending: false });
      setFeedback(data || []);
      setLoading(false);
    };
    fetchFeedback();
  }, [guest.id]);

  const formatDay = (dateStr: string) => {
    try { return format(new Date(dateStr), "dd"); } catch { return "--"; }
  };
  const formatMonth = (dateStr: string) => {
    try { return format(new Date(dateStr), "MMM").toUpperCase(); } catch { return "--"; }
  };

  if (loading) {
    return (
      <div className="rounded-2xl p-8 flex items-center justify-center" style={{ backgroundColor: '#26262699' }}>
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-2xl p-8 flex flex-col items-center justify-center text-center" style={{ backgroundColor: '#26262699' }}>
        <MessageSquare className="w-10 h-10 text-neutral-500 mb-1" />
        <p className="text-neutral-400 text-sm">No feedback available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((item) => {
        const isExpanded = expandedId === item.id;
        const truncated = item.comment.length > 80 ? item.comment.slice(0, 80) + "..." : item.comment;
        const showMore = item.comment.length > 80;
        const platform = platformLogos[item.platform];

        return (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#26262699' }}
          >
            <div className="flex items-center gap-4 px-4 py-3.5">
              {/* Date Block */}
              <div className="flex-shrink-0 flex flex-col items-center w-12 border-r border-neutral-600/50 pr-4">
                <span className="text-lg font-bold text-foreground leading-tight">{formatDay(item.feedback_date)}</span>
                <span className="text-xs text-neutral-400 uppercase">{formatMonth(item.feedback_date)}</span>
              </div>

              {/* Smileys */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Frown className={`w-5 h-5 ${item.sentiment === "negative" ? "text-neutral-300" : "text-neutral-600"}`} />
                <Smile className={`w-5 h-5 ${item.sentiment === "positive" ? "text-neutral-300" : "text-neutral-600"}`} />
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-neutral-600/50 flex-shrink-0" />

              {/* Comment Icon + Text */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <p className="text-sm text-neutral-300 truncate">
                  {isExpanded ? item.comment : truncated}
                  {showMore && !isExpanded && (
                    <button
                      onClick={() => setExpandedId(item.id)}
                      className="text-foreground font-medium ml-1"
                    >
                      More
                    </button>
                  )}
                </p>
              </div>

              {/* Platform Logo */}
              <div className="flex-shrink-0 w-24 flex justify-end">
                {platform?.src ? (
                  <img src={platform.src} alt={item.platform} className="h-5 object-contain" />
                ) : platform?.text ? (
                  <span className={platform.textClass}>{platform.text}</span>
                ) : (
                  <span className="text-xs text-neutral-400 capitalize">{item.platform}</span>
                )}
              </div>
            </div>

            {/* Expanded full comment */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-0">
                <div className="pl-[calc(3rem+1rem+2.5rem+0.25rem+1px+0.5rem)]">
                  <p className="text-sm text-neutral-300 leading-relaxed">{item.comment}</p>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-xs text-neutral-500 mt-2 hover:text-neutral-300 transition-colors"
                  >
                    Show less
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackTabContent;
