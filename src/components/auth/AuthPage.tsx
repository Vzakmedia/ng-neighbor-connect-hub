import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User as LogIn, 
  UserPlus, 
  ArrowLeft,
  Send,
  Star,
  Video,
  Clock,
  Users,
  Bell,
  Zap,
  Wifi,
  MessageSquare
} from '@/lib/icons';
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import AuthBackground from "./AuthBackground";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { PrivateBrowsingWarning } from "@/components/mobile/PrivateBrowsingWarning";
import { isNativePlatform } from "@/utils/nativeStartup";
import characterImg from '@/assets/character.png';

const DESKTOP_BG_ELEMENTS = [
  // Left-margin vertical stack
  { Icon: Send, x: 5, y: 3, size: 'w-6 h-6', rotation: -15 },
  { Icon: null, x: 5, y: 15, size: 'w-3 h-3', isSquare: true, rotation: 45 },
  { Icon: Bell, x: 5, y: 38, size: 'w-6 h-6', rotation: 0 },
  { Icon: Zap, x: 5, y: 55, size: 'w-6 h-6', rotation: 15 },
  { Icon: Wifi, x: 5, y: 72, size: 'w-6 h-6', rotation: -10 },
  { Icon: MessageSquare, x: 5, y: 92, size: 'w-6 h-6', rotation: 10 },
  { Icon: null, x: 5, y: 82, size: 'w-2 h-2', isDot: true },
  
  // Top-middle area above card
  { Icon: null, x: 25, y: 3, size: 'w-2 h-2', isDot: true },
  { Icon: Video, x: 25, y: 15, size: 'w-6 h-6', rotation: 10 },
  { Icon: Clock, x: 50, y: 15, size: 'w-6 h-6', rotation: 0 },
  { Icon: null, x: 38, y: 3, size: 'w-2 h-2', isDot: true },

  // Right-margin vertical stack
  { Icon: Users, x: 93, y: 15, size: 'w-6 h-6', rotation: 0 },
  { Icon: null, x: 94, y: 45, size: 'w-3 h-3', isSquare: true, rotation: 45 },
  { Icon: Star, x: 93, y: 90, size: 'w-6 h-6', rotation: 15 },
  { Icon: null, x: 92, y: 72, size: 'w-2 h-2', isDot: true },
];

const ANIMATED_TAGLINES = [
  {
    first: [
      { text: "Connect with your", color: "text-black" }
    ],
    rest: [
      { text: " neighbors", color: "text-[#059669]" },
      { text: " like never before", color: "text-black" }
    ]
  },
  {
    first: [
      { text: "Keep your ", color: "text-black" },
      { text: "community", color: "text-[#059669]" }
    ],
    rest: [
      { text: " safe and secure together", color: "text-black" }
    ]
  },
  {
    first: [
      { text: "Buy and sell", color: "text-black" }
    ],
    rest: [
      { text: " locally on the neighborhood ", color: "text-black" },
      { text: "marketplace", color: "text-[#059669]" }
    ]
  }
];

const renderTypedSegments = (segments: { text: string; color: string }[], charCount: number) => {
  let remainingChars = charCount;
  return segments.map((seg, idx) => {
    if (remainingChars <= 0) return null;
    const textToShow = seg.text.substring(0, remainingChars);
    remainingChars -= seg.text.length;
    return (
      <span key={idx} className={seg.color}>
        {textToShow}
      </span>
    );
  });
};

const TaglineRotator = () => {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<"fade-in" | "typing" | "idle" | "fade-out">("fade-in");
  const [charCount, setCharCount] = useState(0);

  const currentTagline = ANIMATED_TAGLINES[index];
  const totalRestLength = currentTagline.rest.reduce((acc, seg) => acc + seg.text.length, 0);

  useEffect(() => {
    let timer: any;

    if (step === "fade-in") {
      timer = setTimeout(() => {
        setStep("typing");
      }, 800);
    } else if (step === "typing") {
      if (charCount < totalRestLength) {
        timer = setTimeout(() => {
          setCharCount(prev => prev + 1);
        }, 45); // Typing speed per character (45ms)
      } else {
        setStep("idle");
      }
    } else if (step === "idle") {
      timer = setTimeout(() => {
        setStep("fade-out");
      }, 2500); // Reading pause (2.5s)
    } else if (step === "fade-out") {
      timer = setTimeout(() => {
        setIndex(prev => (prev + 1) % ANIMATED_TAGLINES.length);
        setCharCount(0);
        setStep("fade-in");
      }, 800);
    }

    return () => clearTimeout(timer);
  }, [step, charCount, index, totalRestLength]);

  const opacityClass = step === "fade-out" 
    ? "opacity-0 transition-opacity duration-800 ease-in-out" 
    : "opacity-100";
  const firstOpacityClass = step === "fade-in" 
    ? "opacity-0" 
    : "opacity-100 transition-opacity duration-800 ease-in-out";

  return (
    <h1 className={`text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] max-w-xl min-h-[140px] md:min-h-[180px] lg:min-h-[220px] select-none ${opacityClass}`}>
      {/* First part: fades in first */}
      <span className={firstOpacityClass}>
        {currentTagline.first.map((seg, idx) => (
          <span key={idx} className={seg.color}>
            {seg.text}
          </span>
        ))}
      </span>
      {/* Second part: types in character-by-character */}
      {renderTypedSegments(currentTagline.rest, charCount)}
      {/* Blinking cursor */}
      {step === "typing" && (
        <span className="animate-blink border-l-2 border-community-primary ml-1 h-[0.9em]" style={{ verticalAlign: "middle" }} />
      )}
    </h1>
  );
};

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => {
    return !isNativePlatform() && window.innerWidth >= 768;
  });

  useEffect(() => {
    if (isNativePlatform()) return;
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Desktop Split-Screen Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen flex flex-col bg-white select-none">
        <style>{`
          @keyframes float-gentle {
            0% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
            50% { transform: translateY(-8px) rotate(calc(var(--rot, 0deg) + 3deg)); }
            100% { transform: translateY(0px) rotate(var(--rot, 0deg)); }
          }
          .animate-float {
            animation: float-gentle 6s ease-in-out infinite;
          }
          
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .animate-blink {
            animation: blink 0.8s step-end infinite;
          }
          
          /* Custom overrides for the dark card content to match the exact mockup styling */
          .dark-auth-card {
            background-color: #131714 !important;
            border: none !important;
            border-radius: 1rem !important;
            padding: 2.5rem 2rem !important;
          }
          .dark-auth-card input {
            background-color: #242b30 !important;
            border: 1px solid #2e373d !important;
            color: #ffffff !important;
            border-radius: 0.5rem !important;
            padding: 0.75rem 1rem !important;
            font-size: 0.875rem !important;
            height: auto !important;
          }
          .dark-auth-card input:focus {
            border-color: #059669 !important;
            outline: none !important;
            box-shadow: 0 0 0 1px #059669 !important;
          }
          .dark-auth-card label {
            color: #ffffff !important;
            font-weight: 500 !important;
            font-size: 0.875rem !important;
          }
          .dark-auth-card button[type="submit"] {
            background-color: #059669 !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            border-radius: 0.5rem !important;
            padding: 0.75rem 1rem !important;
            font-size: 0.95rem !important;
            transition: all 0.2s ease !important;
          }
          .dark-auth-card button[type="submit"]:hover {
            background-color: #047857 !important;
          }
          .dark-auth-card button.w-full:not([type="submit"]) {
            background-color: #000000 !important;
            border: 1px solid #27272a !important;
            color: #ffffff !important;
            border-radius: 0.5rem !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
          }
          .dark-auth-card button.w-full:not([type="submit"]):hover {
            background-color: #18181b !important;
          }
          .dark-auth-card button.absolute {
            background: transparent !important;
            border: none !important;
            color: #9ca3af !important;
          }
          .dark-auth-card button.absolute:hover {
            color: #ffffff !important;
          }
          .dark-auth-card button.text-sm.text-muted-foreground {
            color: #9ca3af !important;
            font-size: 0.85rem !important;
          }
          .dark-auth-card button.text-sm.text-muted-foreground:hover {
            color: #ffffff !important;
            text-decoration: underline !important;
          }
          .dark-auth-card .text-muted-foreground {
            color: #9ca3af !important;
          }
          .dark-auth-card .border-t {
            border-color: #27272a !important;
          }
        `}</style>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Left Column (Logo, Tagline, Illustration) */}
          <div className="w-full md:w-1/2 flex flex-col justify-between pt-16 px-16 md:pt-20 md:px-20 lg:pt-24 lg:px-24 pb-0 bg-white min-h-[500px]">
            <div className="flex flex-col space-y-12">
              <div className="flex items-center space-x-2">
                <img 
                  src="/neighborlink-logo.png" 
                  alt="NeighborLink Logo" 
                  className="h-20 w-20 rounded-2xl object-contain"
                />
              </div>
              <TaglineRotator />
            </div>
            
            <div className="mt-8 flex justify-start w-full">
              <img 
                src={characterImg} 
                alt="Community Connect" 
                className="w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl object-contain"
              />
            </div>
          </div>

          {/* Right Column (Floating Pattern and Dark Card) */}
          <div className="w-full md:w-1/2 bg-[#f8faf9] flex items-center justify-center p-8 lg:p-16 relative border-t md:border-t-0 md:border-l border-neutral-300 overflow-hidden min-h-[600px]">
            {/* Background floating icons pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              {DESKTOP_BG_ELEMENTS.map((el, idx) => {
                if (el.isDot) {
                  return (
                    <div
                      key={idx}
                      className="absolute bg-[#059669]/20 w-2.5 h-2.5 rounded-full animate-float"
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        animationDelay: `${idx * 0.3}s`,
                        animationDuration: `${6 + (idx % 4)}s`,
                      } as React.CSSProperties}
                    />
                  );
                }
                if (el.isSquare) {
                  return (
                    <div
                      key={idx}
                      className="absolute bg-[#059669]/15 w-3 h-3 animate-float"
                      style={{
                        left: `${el.x}%`,
                        top: `${el.y}%`,
                        transform: `rotate(${el.rotation}deg)`,
                        animationDelay: `${idx * 0.3}s`,
                        animationDuration: `${6 + (idx % 4)}s`,
                        '--rot': `${el.rotation}deg`
                      } as React.CSSProperties}
                    />
                  );
                }
                const IconComponent = el.Icon!;
                return (
                  <div
                    key={idx}
                    className={`absolute text-[#059669]/15 ${el.size} animate-float`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      animationDelay: `${idx * 0.3}s`,
                      animationDuration: `${6 + (idx % 4)}s`,
                      '--rot': `${el.rotation}deg`
                    } as React.CSSProperties}
                  >
                    <IconComponent className="w-full h-full" strokeWidth={1.5} />
                  </div>
                );
              })}
            </div>

            {/* Dark Auth Card */}
            <Card className="dark-auth-card w-full max-w-[450px] relative z-10 text-white shadow-2xl">
              <CardHeader className="text-center space-y-4 p-0 pb-6">
                <div className="flex items-center justify-center space-x-2">
                  <img 
                    src="/neighborlink-logo.png" 
                    alt="NeighborLink Logo" 
                    className="h-10 w-10 rounded-xl object-contain"
                  />
                  <CardTitle className="text-2xl font-bold text-community-primary">
                    NeighborLink
                  </CardTitle>
                </div>
                <CardDescription className="text-neutral-400">
                  Connect with your neighborhood community
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PrivateBrowsingWarning />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex mb-6 w-full justify-start bg-transparent border-b border-neutral-800 rounded-none h-auto p-0 space-x-6">
                    <TabsTrigger 
                      value="login" 
                      className="bg-transparent border-b-2 border-transparent rounded-none px-0 pb-2 text-sm font-semibold text-neutral-400 data-[state=active]:border-community-primary data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="bg-transparent border-b-2 border-transparent rounded-none px-0 pb-2 text-sm font-semibold text-neutral-400 data-[state=active]:border-community-primary data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4 mt-0">
                    <LoginForm onSwitchToReset={() => setActiveTab("reset")} />
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#131714] px-2 text-neutral-500">Or continue with</span>
                      </div>
                    </div>
                    <GoogleAuthButton mode="signin" />
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-4 mt-0">
                    <SignUpForm />
                  </TabsContent>
                  
                  <TabsContent value="reset" className="space-y-4 mt-0">
                    <ResetPasswordForm onBack={() => setActiveTab("login")} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Desktop Footer */}
        <footer className="w-full bg-white border-t border-slate-200 py-6 px-8 lg:px-16 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 space-y-4 sm:space-y-0 z-20 select-text">
          <div>
            © Neighborlink 2026
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/company" className="hover:underline hover:text-slate-900 transition-colors">Company</Link>
            <Link to="/about" className="hover:underline hover:text-slate-900 transition-colors">About</Link>
            <Link to="/careers" className="hover:underline hover:text-slate-900 transition-colors">Careers</Link>
            <Link to="/blog" className="hover:underline hover:text-slate-900 transition-colors">Blog</Link>
            <Link to="/privacy" className="hover:underline hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:underline hover:text-slate-900 transition-colors text-center">Terms and Conditions</Link>
          </div>
        </footer>
      </div>
    );
  }

  // Mobile & Native Layout (Unchanged)
  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <AuthBackground />
      <Button 
        variant="outline" 
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-20"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-background/95 border border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <img 
              src="/neighborlink-logo.png" 
              alt="NeighborLink Logo" 
              className="h-10 w-10 rounded-xl object-contain"
            />
            <CardTitle className="text-2xl font-bold text-community-primary">
              NeighborLink
            </CardTitle>
          </div>
          <CardDescription>
            Connect with your neighborhood community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrivateBrowsingWarning />
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop tabs */}
            <TabsList className="hidden md:flex mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Mobile tabs */}
            <TabsList className="md:hidden flex mb-4 w-full justify-center">
              <TabsTrigger value="login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <LoginForm onSwitchToReset={() => setActiveTab("reset")} />
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <GoogleAuthButton mode="signin" />
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <SignUpForm />
            </TabsContent>
            
            <TabsContent value="reset" className="space-y-4 mt-6">
              <ResetPasswordForm onBack={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};