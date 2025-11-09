import React, { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, useScroll, useTransform, useMotionValue, useInView, animate } from "framer-motion";
import { Users, Shield, MessageSquare, MapPin, Calendar, ShoppingBag, Heart, Zap, CheckCircle, Star, ArrowRight, Phone, Mail, Globe, Smartphone, Monitor, Tablet, Play, TrendingUp, Award, Clock, UserPlus, Eye, MousePointer, Sparkles, ArrowLeft, Facebook, Instagram, Twitter, Linkedin, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import communityHero from '@/assets/community-hero.jpg';
import landingBg from '@/assets/landing-bg.png';
import heroBackground from '@/assets/hero-background.png';
import communityConnect from '@/assets/community-connect.png';
import communityConnectionImg from '@/assets/landing/community-connection.jpg';
import safetySecurityImg from '@/assets/landing/safety-security.jpg';
import directMessagingImg from '@/assets/landing/direct-messaging.jpg';
import localMarketplaceImg from '@/assets/landing/local-marketplace.jpg';
import communityEventsImg from '@/assets/landing/community-events.jpg';
import locationServicesImg from '@/assets/landing/location-services.jpg';
import sarahJohnsonImg from "@/assets/testimonials/sarah-johnson.jpg";
import ahmedIbrahimImg from "@/assets/testimonials/ahmed-ibrahim.jpg";
import graceOkaforImg from "@/assets/testimonials/grace-okafor.jpg";

// Newsletter form validation schema
const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

// Counter animation component
const CountUpAnimation = ({ value, className }: { value: string; className?: string }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    // Parse the number from the value string
    let targetNumber = 0;
    let suffix = "";
    let prefix = "";

    if (value.includes("K+")) {
      targetNumber = parseFloat(value.replace("K+", "")) * 1000;
      suffix = "K+";
    } else if (value.includes("%")) {
      targetNumber = parseFloat(value.replace("%", ""));
      suffix = "%";
    } else if (value.includes("/")) {
      // For "24/7" style values, just display immediately
      setDisplayValue(value);
      return;
    } else if (value.includes(",")) {
      targetNumber = parseFloat(value.replace(/,/g, ""));
    } else {
      targetNumber = parseFloat(value);
    }

    const controls = animate(count, targetNumber, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (suffix === "K+") {
          setDisplayValue(Math.floor(latest / 1000) + "K+");
        } else if (suffix === "%") {
          setDisplayValue(Math.floor(latest) + "%");
        } else if (value.includes(",")) {
          setDisplayValue(Math.floor(latest).toLocaleString());
        } else {
          setDisplayValue(Math.floor(latest).toString());
        }
      }
    });

    return () => controls.stop();
  }, [isInView, value, count]);

  return (
    <div ref={ref} className={className}>
      {displayValue}
    </div>
  );
};

// Newsletter subscription component
const NewsletterForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: data.email.toLowerCase() }]);

      if (error) {
        // Check if it's a duplicate email error
        if (error.code === '23505') {
          toast({
            title: "Already subscribed!",
            description: "This email is already registered for our newsletter.",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Successfully subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        });
        reset();
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Subscription failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center space-y-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">Stay Updated</h3>
        <p className="text-white/70">
          Subscribe to our newsletter for community updates, safety tips, and local news.
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/40"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-300 mt-1 text-left">{errors.email.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          variant="secondary"
          disabled={isSubmitting}
          className="sm:w-auto whitespace-nowrap"
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
          <Mail className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

const InteractiveLandingPage = () => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState("community-connection");
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const {
    scrollY
  } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);

  const features = [{
    id: "community-connection",
    icon: Users,
    title: "Community Connection",
    description: "Connect with neighbors, share experiences, and build lasting relationships in your local community through our intuitive platform.",
    shortDesc: "Connect with verified neighbors in your area",
    color: "from-primary to-primary/80",
    image: communityConnectionImg
  }, {
    id: "safety-security",
    icon: Shield,
    title: "Safety & Security",
    description: "Share safety alerts, report incidents, and keep your neighborhood secure with our advanced emergency response features.",
    shortDesc: "Emergency alerts and verified user profiles",
    color: "from-green-500 to-emerald-500",
    image: safetySecurityImg
  }, {
    id: "direct-messaging",
    icon: MessageSquare,
    title: "Direct Messaging",
    description: "Secure, private messaging with neighbors including voice calls and video chat capabilities for seamless communication.",
    shortDesc: "Secure messaging with your neighbors",
    color: "from-purple-500 to-pink-500",
    image: directMessagingImg
  }, {
    id: "local-marketplace",
    icon: ShoppingBag,
    title: "Local Marketplace",
    description: "Buy and sell items within your community. Find local goods and services easily with verified transactions.",
    shortDesc: "Buy and sell within your neighborhood",
    color: "from-orange-500 to-red-500",
    image: localMarketplaceImg
  }, {
    id: "community-events",
    icon: Calendar,
    title: "Community Events",
    description: "Discover, create, and attend local events. Stay connected with what's happening around you every day.",
    shortDesc: "Discover local events and activities",
    color: "from-yellow-500 to-orange-500",
    image: communityEventsImg
  }, {
    id: "location-services",
    icon: MapPin,
    title: "Location Services",
    description: "Find local services, businesses, and resources specific to your neighborhood with our hyper-local features.",
    shortDesc: "Hyper-local neighborhood features",
    color: "from-indigo-500 to-purple-500",
    image: locationServicesImg
  }];

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sync carousel scroll when activeFeature changes (tab click)
  useEffect(() => {
    if (!carouselApi) return;

    const featureIndex = features.findIndex(f => f.id === activeFeature);
    if (featureIndex !== -1 && featureIndex !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(featureIndex);
    }
  }, [activeFeature, carouselApi, features]);

  // Sync active feature with carousel position when user drags
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const currentIndex = carouselApi.selectedScrollSnap();
      setActiveFeature(features[currentIndex].id);
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, features]);

  // Auto-scroll carousel functionality
  useEffect(() => {
    if (!carouselApi || isCarouselHovered) return;

    const autoScroll = setInterval(() => {
      const currentIndex = carouselApi.selectedScrollSnap();
      const slideCount = carouselApi.scrollSnapList().length;
      
      const nextIndex = currentIndex === slideCount - 1 ? 0 : currentIndex + 1;
      carouselApi.scrollTo(nextIndex);
      setActiveFeature(features[nextIndex].id);
    }, 5000);

    return () => clearInterval(autoScroll);
  }, [carouselApi, isCarouselHovered, features]);

  const analyticsStats = [
    {
      number: "50K+",
      label: "Active Neighbors"
    },
    {
      number: "98%",
      label: "Community Satisfaction"
    },
    {
      number: "1,238",
      label: "Neighborhoods"
    },
    {
      number: "24/7",
      label: "Safety Support"
    }
  ];

  const liveStats = [{
    number: "50,247",
    label: "Active Users",
    icon: Users,
    increment: 3
  }, {
    number: "1,238",
    label: "Communities",
    icon: MapPin,
    increment: 1
  }, {
    number: "24/7",
    label: "Support",
    icon: Clock,
    increment: 0
  }, {
    number: "99.9%",
    label: "Uptime",
    icon: Award,
    increment: 0
  }];
  const testimonials = [{
    name: "Sarah Johnson",
    role: "CEO — Notion.so",
    content: "I love how simple, yet very efficient Connect CRM is. The ability to customize properties has been a huge benefit to both my sales team and our reporting.",
    image: sarahJohnsonImg
  }, {
    name: "Ahmed Ibrahim",
    role: "Product Manager — Google",
    content: "Found amazing local services and made great friends through this platform. Highly recommended!",
    image: ahmedIbrahimImg
  }, {
    name: "Grace Okafor",
    role: "Designer — Apple",
    content: "The marketplace feature is fantastic. I've bought and sold items easily within my neighborhood.",
    image: graceOkaforImg
  }];

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = React.useState(0);

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => 
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };
  const FloatingElements = () => <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({
      length: 20
    }).map((_, i) => <motion.div key={i} className="absolute w-2 h-2 bg-primary/10 rounded-full" animate={{
      x: [0, Math.random() * 100 - 50],
      y: [0, Math.random() * 100 - 50],
      opacity: [0, 1, 0]
    }} transition={{
      duration: Math.random() * 3 + 2,
      repeat: Infinity,
      delay: Math.random() * 2
    }} style={{
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%'
    }} />)}
    </div>;
  return <div className="min-h-screen bg-muted/30">
      <FloatingElements />
      
      {/* Animated cursor follower */}
      <motion.div className="fixed w-6 h-6 border-2 border-primary/30 rounded-full pointer-events-none z-50 mix-blend-difference" animate={{
      x: mousePosition.x - 12,
      y: mousePosition.y - 12
    }} transition={{
      type: "spring",
      damping: 20,
      stiffness: 400
    }} />

      {/* Main full-width container */}
      <div className="w-full bg-background relative overflow-hidden">
        {/* Header */}
        <motion.header initial={{
        y: -100
      }} animate={{
        y: 0
      }} className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-20 md:h-24 items-center justify-between px-6 md:px-12 lg:px-16 xl:px-24">
          <motion.div whileHover={{
            scale: 1.05
          }} whileTap={{
            scale: 0.95
          }}>
            <Link to="/" className="flex items-center space-x-2">
              <img src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" alt="NeighborLink Logo" className="h-10 w-10 md:h-12 md:w-12" />
              <span className="font-bold text-2xl md:text-3xl">NeighborLink</span>
            </Link>
          </motion.div>
          
          <nav className="hidden md:flex items-center space-x-8">
            {['Features', 'About', 'Testimonials', 'Contact'].map((item, index) => {
              const href = item === 'About' ? '/about' : `#${item.toLowerCase()}`;
              const LinkComponent = item === 'About' ? Link : 'a';
              return <motion.div key={item}>
                  <LinkComponent href={item === 'About' ? undefined : href} to={item === 'About' ? href : undefined} className="text-base md:text-lg font-medium hover:text-primary transition-colors">
                    {item}
                  </LinkComponent>
                </motion.div>;
            })}
          </nav>
          
          <div className="hidden md:flex items-center space-x-3">
            <motion.div whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
              <Link to="/auth">
                <Button variant="ghost" size="default">Login</Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
              <Link to="/auth">
                <Button size="default">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        {/* Mobile Menu Overlay */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isMobileMenuOpen ? 1 : 0,
            height: isMobileMenuOpen ? 'auto' : 0
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="md:hidden overflow-hidden border-t bg-background"
        >
          <nav className="flex flex-col space-y-1 p-6">
            {['Features', 'About', 'Testimonials', 'Contact'].map((item, index) => {
              const href = item === 'About' ? '/about' : `#${item.toLowerCase()}`;
              const LinkComponent = item === 'About' ? Link : 'a';
              return (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{
                    opacity: isMobileMenuOpen ? 1 : 0,
                    x: isMobileMenuOpen ? 0 : -20
                  }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <LinkComponent
                    href={item === 'About' ? undefined : href}
                    to={item === 'About' ? href : undefined}
                    className="block py-3 px-4 text-lg font-medium hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </LinkComponent>
                </motion.div>
              );
            })}
            
            <Separator className="my-2" />
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isMobileMenuOpen ? 1 : 0,
                x: isMobileMenuOpen ? 0 : -20
              }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="space-y-3 pt-2"
            >
              <Link to="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg" size="lg">
                  Login
                </Button>
              </Link>
              <Link to="/auth" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full text-lg" size="lg">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </nav>
        </motion.div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] md:min-h-screen">
        {/* Background image layer */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />
        
        {/* Mouse-following pulsating gradient circle */}
        <motion.div 
          className="fixed w-[500px] h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] rounded-full blur-[120px] pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle, hsl(162, 85%, 30%) 0%, hsl(162, 75%, 25%) 30%, transparent 70%)'
          }}
          animate={{ 
            x: mousePosition.x - 250,
            y: mousePosition.y - 250,
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.1, 1]
          }}
          transition={{
            x: { type: "spring", stiffness: 50, damping: 30 },
            y: { type: "spring", stiffness: 50, damping: 30 },
            opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        
        <div className="w-full relative min-h-[calc(100vh-4rem)] md:min-h-screen flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl lg:max-w-7xl px-4 sm:px-6 md:px-8 py-1 sm:py-2 md:py-3 mx-auto my-[100px] mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <motion.div initial={{
              opacity: 0,
              y: 30
            }} animate={{
              opacity: isVisible ? 1 : 0,
              y: isVisible ? 0 : 30
            }} transition={{
              duration: 0.8
            }} className="space-y-6 sm:space-y-8 text-center">
              <div className="space-y-4 sm:space-y-6">
                
                <motion.h1 
                  initial={{
                    opacity: 0,
                    y: 20
                  }} 
                  animate={{
                    opacity: 1,
                    y: 0
                  }} 
                  transition={{
                    delay: 0.3
                  }} 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight px-2"
                >
                  Connect with your <span className="inline-block text-white bg-[hsl(var(--community-green))] px-4 py-2 rounded-lg">
                    neighbors
                  </span><br />
                  like never before
                </motion.h1>
                
                <motion.p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-md sm:max-w-lg lg:max-w-3xl mx-auto leading-relaxed px-4" initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }} transition={{
                  delay: 0.4
                }}>
                  Join thousands of Nigerians building safer, more connected communities. 
                  Share resources, stay safe, and create lasting bonds with your neighbors.
                </motion.p>
              </div>
              
              <motion.div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4" initial={{
                opacity: 0,
                y: 20
              }} animate={{
                opacity: 1,
                y: 0
              }} transition={{
                delay: 0.5
              }}>
                <motion.div whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.95
                }}>
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Your Community
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{
                  scale: 1.05
                }} whileTap={{
                  scale: 0.95
                }}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto group text-sm sm:text-base">
                    <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Watch Demo
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Community Connection Visual - Outside constrained div */}
          <motion.div initial={{
            opacity: 0,
            y: 30,
            scale: 0.95
          }} animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }} whileInView={{
            opacity: 1,
            y: 0,
            scale: 1
          }} whileHover={{
            scale: 1.02,
            transition: {
              duration: 0.3,
              ease: "easeOut"
            }
          }} viewport={{
            once: false,
            margin: "-100px"
          }} transition={{
            delay: 0.8,
            duration: 0.6,
            ease: "easeOut"
          }} className="w-full px-4 sm:px-6 md:px-8 lg:px-12 mt-8 sm:mt-12 md:mt-16 group relative z-30">
            <img src={communityConnect} alt="Community Connection Network" className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto h-auto 
                         rounded-lg
                         transition-all duration-300 ease-out
                         group-hover:brightness-105" />
          </motion.div>
        </div>
        
        {/* Fade-out gradient overlay at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[200px] md:h-[300px] pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.3) 30%, hsl(var(--background) / 0.7) 60%, hsl(var(--background)) 100%)'
          }}
        />
      </section>

      {/* Analytics Section */}
      <section className="py-24 px-6 md:px-12 lg:px-16 xl:px-24 relative">
        <div className="w-full">
          {/* ANALYTICS Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-0.5 h-6 bg-primary"></div>
            <div className="text-primary text-sm font-medium tracking-wider">ANALYTICS</div>
          </motion.div>

          {/* Heading and Content */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Community impact in numbers
              </h2>
            </div>
            <div className="flex items-center">
              <p className="text-muted-foreground text-lg">
                Real-time statistics showcasing the power of community connection across Nigeria.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-none shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {analyticsStats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="text-center"
                  >
                    <CountUpAnimation 
                      value={stat.number}
                      className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2"
                    />
                    <div className="text-sm md:text-base text-white/90 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section with Tabs */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* FEATURES Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-0.5 h-6 bg-primary"></div>
            <div className="text-primary text-sm font-medium tracking-wider">FEATURES</div>
          </motion.div>

          {/* Heading and Description Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid lg:grid-cols-2 gap-8 mb-12"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Everything you need for community living
              </h2>
            </div>
            <div className="flex items-center">
              <p className="text-muted-foreground text-lg">
                Powerful features designed to enhance your neighborhood experience and bring your community closer together.
              </p>
            </div>
          </motion.div>

          {/* Feature Tabs Carousel */}
          <Tabs value={activeFeature} onValueChange={setActiveFeature} className="w-full mb-12">
            <div 
              className="relative"
              onMouseEnter={() => setIsCarouselHovered(true)}
              onMouseLeave={() => setIsCarouselHovered(false)}
            >
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: "start",
                  dragFree: false,
                  containScroll: "keepSnaps",
                  loop: false,
                }}
                className="w-full px-12"
              >
                <TabsList className="w-full h-auto bg-transparent p-0 mb-16">
                  <CarouselContent className="-ml-4">
                    {features.map((feature) => (
                      <CarouselItem key={feature.id} className="pl-4 basis-auto">
                        <TabsTrigger
                          value={feature.id}
                          className="min-w-[300px] flex-shrink-0 data-[state=active]:bg-primary/10 data-[state=active]:border-primary/30 data-[state=inactive]:bg-background data-[state=inactive]:border-border p-6 rounded-lg border-2 h-auto flex flex-col items-start gap-3 text-left transition-all cursor-grab active:cursor-grabbing"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <feature.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-2 text-foreground">{feature.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{feature.shortDesc}</p>
                          </div>
                        </TabsTrigger>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </TabsList>
                <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-md" />
                <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background shadow-md" />
              </Carousel>
            </div>

            {/* Content Area - Image Only */}
            {features.map((feature) => (
              <TabsContent key={feature.id} value={feature.id} className="mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Testimonials Section - Exact Mockup Format */}
      <section id="testimonials" className="py-24 overflow-hidden">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          {/* TESTIMONIAL Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-0.5 h-6 bg-primary"></div>
            <div className="text-primary text-sm font-medium tracking-wider">TESTIMONIAL</div>
          </motion.div>

          {/* Top Row - Heading Left, Stats Right */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
            {/* Left Side - Heading */}
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight max-w-lg">
                Don't just take it from us, but from our users
              </h2>
            </div>

            {/* Right Side - Stats */}
            <div className="flex gap-16">
              <div>
                <h3 className="text-5xl font-bold">2k+</h3>
                <p className="text-muted-foreground mt-1">Happy Customers</p>
              </div>
              <div>
                <h3 className="text-5xl font-bold">4.8</h3>
                <p className="text-muted-foreground mt-1">From 1,533 rating</p>
              </div>
            </div>
          </div>

          {/* Full-Width Testimonial Card */}
          <motion.div
            key={currentTestimonialIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-12 bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent border-green-500/20">
              <div className="max-w-4xl mx-auto space-y-8">
                <p className="text-2xl lg:text-3xl leading-relaxed font-normal">
                  "{testimonials[currentTestimonialIndex].content}"
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonials[currentTestimonialIndex].image} 
                      alt={testimonials[currentTestimonialIndex].name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-green-500/20"
                    />
                    <div>
                      <h4 className="font-semibold text-lg">
                        {testimonials[currentTestimonialIndex].name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonials[currentTestimonialIndex].role}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevTestimonial}
                      className="rounded-full"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextTestimonial}
                      className="rounded-full"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>


      {/* Device Compatibility Section */}
      <section className="py-24 bg-muted/30">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          {/* MULTI-PLATFORM Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-0.5 h-6 bg-primary"></div>
            <div className="text-primary text-sm font-medium tracking-wider">MULTI-PLATFORM</div>
          </motion.div>

          {/* Heading and Description */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Available everywhere you are
              </h2>
            </div>
            <div className="flex items-center">
              <p className="text-muted-foreground text-lg">
                Access NeighborLink on any device. Seamless experience across web, mobile, and tablet.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[{
              icon: Smartphone,
              title: "Mobile App",
              desc: "Native iOS and Android apps with full feature access"
            }, {
              icon: Monitor,
              title: "Web Platform",
              desc: "Full-featured web application accessible from any browser"
            }, {
              icon: Tablet,
              title: "Tablet Optimized",
              desc: "Responsive design optimized for tablet interactions"
            }].map((device, index) => {
              const IconComponent = device.icon;
              return <motion.div key={index} initial={{
                opacity: 0,
                y: 50
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: index * 0.2
              }} whileHover={{
                y: -10,
                scale: 1.05
              }}>
                  <Card className="p-8 space-y-4 hover:shadow-xl transition-shadow h-full">
                    <motion.div animate={{
                    rotateY: [0, 180, 360]
                  }} transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}>
                      <IconComponent className="w-12 h-12 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">{device.title}</h3>
                    <p className="text-muted-foreground">{device.desc}</p>
                  </Card>
                </motion.div>;
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          {/* CONTACT Label with Line */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-0.5 h-6 bg-primary"></div>
            <div className="text-primary text-sm font-medium tracking-wider">CONTACT</div>
          </motion.div>

          {/* Heading and Description */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Get in touch
              </h2>
            </div>
            <div className="flex items-center">
              <p className="text-muted-foreground text-lg">
                Have questions? We're here to help you build stronger communities.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[{
              icon: Mail,
              title: "Email Support",
              info: "support@neighborlink.ng",
              detail: "Response within 24 hours"
            }, {
              icon: Phone,
              title: "Phone Support",
              info: "+234 (0) 800-NEIGHBOR",
              detail: "Mon-Fri, 9AM-6PM WAT"
            }, {
              icon: Globe,
              title: "Online Help",
              info: "help.neighborlink.ng",
              detail: "24/7 self-service support"
            }].map((contact, index) => {
              const IconComponent = contact.icon;
              return <motion.div key={index} initial={{
                opacity: 0,
                y: 50
              }} whileInView={{
                opacity: 1,
                y: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: index * 0.2
              }} whileHover={{
                y: -5,
                scale: 1.02
              }}>
                  <Card className="p-8 space-y-4 hover:shadow-xl transition-all h-full">
                    <motion.div animate={{
                    scale: [1, 1.1, 1]
                  }} transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}>
                      <IconComponent className="w-12 h-12 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">{contact.title}</h3>
                    <p className="text-lg font-medium text-primary">{contact.info}</p>
                    <p className="text-sm text-muted-foreground">{contact.detail}</p>
                  </Card>
                </motion.div>;
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24 py-16">
          {/* CTA Card at top of footer */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-card rounded-2xl shadow-xl p-8 md:p-12 mb-16 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "50px 50px"
            }} />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              {/* Left side - Heading and Description */}
              <div className="space-y-3">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Building stronger communities together
                </h2>
                <p className="text-muted-foreground">
                  Join thousands of Nigerians already creating safer, more connected neighborhoods.
                </p>
              </div>
              
              {/* Right side - Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Download App
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Footer Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand Column */}
            <motion.div 
              className="col-span-2 md:col-span-3 lg:col-span-1 space-y-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-2">
                <img src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" alt="NeighborLink Logo" className="h-8 w-8" />
                <span className="font-bold text-xl">NeighborLink</span>
              </div>
              <p className="text-sm text-white/70">
                Lagos, Nigeria
              </p>
            </motion.div>
            
            {/* Features Column */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Features</h4>
              <div className="space-y-2 text-sm">
                <Link to="/safety" className="block text-white/70 hover:text-white transition-colors">Safety Alerts</Link>
                <Link to="/community" className="block text-white/70 hover:text-white transition-colors">Community Chat</Link>
                <Link to="/events" className="block text-white/70 hover:text-white transition-colors">Local Events</Link>
                <Link to="/safety" className="block text-white/70 hover:text-white transition-colors">Neighborhood Watch</Link>
              </div>
            </div>
            
            {/* Platform Column */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link to="/auth" className="block text-white/70 hover:text-white transition-colors">Web App</Link>
                <a href="#" className="block text-white/70 hover:text-white transition-colors">Mobile App</a>
                <Link to="/api-docs" className="block text-white/70 hover:text-white transition-colors">API Documentation</Link>
              </div>
            </div>
            
            {/* Resources Column */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-white/70 hover:text-white transition-colors">Blog</a>
                <a href="#contact" className="block text-white/70 hover:text-white transition-colors">Help Center</a>
                <Link to="/community-guidelines" className="block text-white/70 hover:text-white transition-colors">Community Guidelines</Link>
                <Link to="/security" className="block text-white/70 hover:text-white transition-colors">Security</Link>
              </div>
            </div>
            
            {/* Community Column */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Community</h4>
              <div className="space-y-2 text-sm">
                <Link to="/community" className="block text-white/70 hover:text-white transition-colors">Online Community</Link>
                <Link to="/events" className="block text-white/70 hover:text-white transition-colors">Events</Link>
                <a href="#" className="block text-white/70 hover:text-white transition-colors">Webinars</a>
              </div>
            </div>
            
            {/* About Us Column */}
            <div>
              <h4 className="font-semibold mb-4 text-white">About Us</h4>
              <div className="space-y-2 text-sm">
                <Link to="/about" className="block text-white/70 hover:text-white transition-colors">About Us</Link>
                <Link to="/careers" className="block text-white/70 hover:text-white transition-colors">Careers</Link>
                <Link to="/press" className="block text-white/70 hover:text-white transition-colors">Press</Link>
                <a href="#contact" className="block text-white/70 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
          
          {/* Newsletter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-t border-white/20 pt-12 mb-12"
          >
            <NewsletterForm />
          </motion.div>
          
          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8">
            <motion.div 
              className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-sm text-white/70">© 2025 NeighborLink. All rights reserved.</p>
              <div className="flex space-x-4">
                <motion.a 
                  href="#" 
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Facebook className="w-5 h-5" />
                  <span className="sr-only">Facebook</span>
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Instagram className="w-5 h-5" />
                  <span className="sr-only">Instagram</span>
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Twitter className="w-5 h-5" />
                  <span className="sr-only">Twitter</span>
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Linkedin className="w-5 h-5" />
                  <span className="sr-only">LinkedIn</span>
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </footer>
      </div>
    </div>;
};
export default InteractiveLandingPage;