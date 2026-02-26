import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Bug, Lightbulb, HelpCircle, Send, Paperclip, Camera, Image as ImageIcon, Video, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";

const INSTABUG_KEY = "instabug-enabled";

export const useInstabugEnabled = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(INSTABUG_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handler = () => {
      setEnabled(localStorage.getItem(INSTABUG_KEY) === "true");
    };
    window.addEventListener("instabug-toggled", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("instabug-toggled", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return enabled;
};

export const setInstabugEnabled = (value: boolean) => {
  localStorage.setItem(INSTABUG_KEY, String(value));
  window.dispatchEvent(new Event("instabug-toggled"));
};

type ReportType = "bug" | "improvement" | "question";

const reportConfig: Record<ReportType, { title: string; placeholder: string; color: string; icon: typeof Bug }> = {
  bug: {
    title: "Report a bug",
    placeholder: "Please be as detailed as possible. What did you expect and what happened instead?",
    color: "hsl(217, 100%, 55%)",
    icon: Bug,
  },
  improvement: {
    title: "Suggest an improvement",
    placeholder: "How can we improve the experience using this app?",
    color: "hsl(217, 100%, 55%)",
    icon: Lightbulb,
  },
  question: {
    title: "Ask a question",
    placeholder: "Ask us anything.",
    color: "hsl(217, 100%, 55%)",
    icon: HelpCircle,
  },
};

const FloatingInstabug = () => {
  const instabugEnabled = useInstabugEnabled();
  const [showMenu, setShowMenu] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-capture screenshot when opening a report type
  const captureScreenshot = async () => {
    try {
      // Hide floating elements temporarily
      const floatingEls = document.querySelectorAll('[data-instabug-hide]');
      floatingEls.forEach(el => (el as HTMLElement).style.display = 'none');
      
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });
      
      floatingEls.forEach(el => (el as HTMLElement).style.display = '');
      setScreenshot(canvas.toDataURL("image/png"));
    } catch {
      console.warn("Screenshot capture failed");
    }
  };

  const handleOpenReport = (type: ReportType) => {
    setActiveReport(type);
    setShowMenu(false);
    // Capture screenshot in background (non-blocking)
    captureScreenshot();
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const parts = dataURL.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
    const bytes = atob(parts[1]);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const uploadFile = async (blob: Blob, name: string): Promise<string | null> => {
    const path = `${Date.now()}-${name}`;
    const { error } = await supabase.storage.from("feedback-attachments").upload(path, blob);
    if (error) { console.error("Upload error", error); return null; }
    const { data } = supabase.storage.from("feedback-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSend = async () => {
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    setSending(true);
    try {
      // Upload screenshot
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const blob = dataURLtoBlob(screenshot);
        screenshotUrl = await uploadFile(blob, "screenshot.png");
      }

      // Upload attachments
      const uploadedUrls: string[] = [];
      for (const att of attachments) {
        const res = await fetch(att.url);
        const blob = await res.blob();
        const url = await uploadFile(blob, att.name);
        if (url) uploadedUrls.push(url);
      }

      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase as any).from("feedback_reports").insert({
        report_type: activeReport!,
        email: email || null,
        description,
        screenshot_url: screenshotUrl,
        attachment_urls: uploadedUrls,
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast.success("Report sent successfully!");
      setEmail("");
      setDescription("");
      setScreenshot(null);
      setAttachments([]);
      setShowAttachOptions(false);
      setActiveReport(null);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast.error("Failed to send report. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (isRecording) stopRecording();
    setActiveReport(null);
    setEmail("");
    setDescription("");
    setScreenshot(null);
    setAttachments([]);
    setShowAttachOptions(false);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setAttachments(prev => [...prev, { name: `recording-${Date.now()}.webm`, url, type: "video" }]);
        setIsRecording(false);
        stream.getTracks().forEach(t => t.stop());
        toast.success("Screen recording saved!");
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setShowAttachOptions(false);
      toast.info("Recording started...");
    } catch {
      toast.error("Screen recording permission denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleTakeScreenshot = async () => {
    setShowAttachOptions(false);
    await captureScreenshot();
    toast.success("Screenshot captured!");
  };

  const handleSelectFile = () => {
    setShowAttachOptions(false);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      setAttachments(prev => [...prev, { name: file.name, url, type: file.type.startsWith("image") ? "image" : "file" }]);
    });
    e.target.value = "";
    toast.success("File attached!");
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (!instabugEnabled) return null;

  // Full-screen report form
  if (activeReport) {
    const config = reportConfig[activeReport];
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: config.color }}>
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="text-white">
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">{config.title}</h1>
          </div>
          <button onClick={handleSend} disabled={sending} className="text-white disabled:opacity-50">
            <Send className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border px-5 py-4">
            <label className="text-sm font-semibold text-foreground block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full text-base text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
            />
          </div>
          <div className="border-b border-border px-5 py-4">
            <label className="text-sm font-semibold text-foreground block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={config.placeholder}
              rows={3}
              className="w-full text-base text-foreground placeholder:text-muted-foreground bg-transparent outline-none resize-none"
            />
          </div>

          {/* Screenshot preview */}
          {screenshot && (
            <div className="px-5 py-4 border-b border-border">
              <div className="relative inline-block">
                <img src={screenshot} alt="Screenshot" className="w-16 h-16 object-cover rounded-lg border border-border" />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                To help us fix the problem, your report will include a list of steps to reproduce the issue.
              </p>
            </div>
          )}

          {/* Additional attachments preview */}
          {attachments.length > 0 && (
            <div className="px-5 py-3 border-b border-border flex flex-wrap gap-3">
              {attachments.map((att, i) => (
                <div key={i} className="relative inline-block">
                  {att.type === "image" ? (
                    <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded-lg border border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-border bg-muted flex flex-col items-center justify-center">
                      <Video className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[56px]">{att.type}</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-foreground font-medium">Recording screen...</span>
              </div>
              <button onClick={stopRecording} className="text-sm font-semibold text-blue-500">
                Stop
              </button>
            </div>
          )}

          {/* Expandable attachment options */}
          {showAttachOptions && (
            <div className="border-t border-border">
              <button
                onClick={handleStartRecording}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors border-b border-border"
              >
                <Video className="w-6 h-6 text-blue-500" />
                <span className="text-foreground font-medium">Start a screen recording</span>
              </button>
              <button
                onClick={handleTakeScreenshot}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors border-b border-border"
              >
                <Camera className="w-6 h-6 text-blue-500" />
                <span className="text-foreground font-medium">Take a screenshot</span>
              </button>
              <button
                onClick={handleSelectFile}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-blue-500" />
                <span className="text-foreground font-medium">Select file from gallery</span>
              </button>
            </div>
          )}
        </div>

        {/* Expand/collapse toggle */}
        <div className="border-t border-border">
          <button
            onClick={() => setShowAttachOptions(!showAttachOptions)}
            className="w-full flex items-center justify-center py-2 text-muted-foreground"
          >
            {showAttachOptions ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Footer */}
        <div className="border-t border-border px-5 py-2 flex items-center justify-center gap-1.5 text-muted-foreground">
          <span className="text-xs">Powered by Instabug</span>
        </div>
      </div>
    );
  }

  // Menu overlay
  if (showMenu) {
    return (
      <>
        <div className="fixed inset-0 z-[9997] bg-black/40" onClick={() => setShowMenu(false)} data-instabug-hide />
        <div className="fixed bottom-24 right-4 z-[9998] bg-card rounded-2xl shadow-2xl overflow-hidden w-64" data-instabug-hide>
          <button
            onClick={() => handleOpenReport("bug")}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
              <Bug className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-foreground font-medium">Report a bug</span>
          </button>
          <div className="h-px bg-border mx-4" />
          <button
            onClick={() => handleOpenReport("improvement")}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/50 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-foreground font-medium">Suggest an improvement</span>
          </button>
          <div className="h-px bg-border mx-4" />
          <button
            onClick={() => handleOpenReport("question")}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-accent/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-foreground font-medium">Ask a question</span>
          </button>
        </div>
        <button
          onClick={() => setShowMenu(false)}
          className="fixed bottom-24 right-4 z-[9999] w-14 h-14 rounded-full bg-blue-500 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          data-instabug-hide
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </>
    );
  }

  // Floating chat icon
  return (
    <button
      onClick={() => setShowMenu(true)}
      className="fixed bottom-24 right-4 z-[9998] w-14 h-14 rounded-full bg-blue-500 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Instabug Feedback"
      data-instabug-hide
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
};

export default FloatingInstabug;
