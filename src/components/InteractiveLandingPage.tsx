import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, useScroll, useTransform } from "framer-motion";
import { Users, Shield, MessageSquare, MapPin, Calendar, ShoppingBag, Heart, Zap, CheckCircle, Star, ArrowRight, Phone, Mail, Globe, Smartphone, Monitor, Tablet, Play, TrendingUp, Award, Clock, UserPlus, Eye, MousePointer, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import communityHero from '@/assets/community-hero.jpg';
import landingBg from '@/assets/landing-bg.png';
import heroBackground from '@/assets/hero-background.png';
import communityConnect from '@/assets/community-connect.png';
const InteractiveLandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const {
    scrollY
  } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);
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
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  const features = [{
    icon: Users,
    title: "Community Connection",
    description: "Connect with neighbors, share experiences, and build lasting relationships in your local community.",
    color: "from-primary to-primary/80",
    bgColor: "bg-primary/5",
    stats: "50K+ neighbors connected"
  }, {
    icon: Shield,
    title: "Safety & Security",
    description: "Share safety alerts, report incidents, and keep your neighborhood secure with emergency features.",
    color: "from-primary to-secondary",
    bgColor: "bg-primary/5",
    stats: "99.9% emergency response rate"
  }, {
    icon: MessageSquare,
    title: "Direct Messaging",
    description: "Secure, private messaging with neighbors including voice calls and video chat capabilities.",
    color: "from-secondary to-primary",
    bgColor: "bg-primary/5",
    stats: "1M+ messages exchanged"
  }, {
    icon: ShoppingBag,
    title: "Local Marketplace",
    description: "Buy and sell items within your community. Find local goods and services easily.",
    color: "from-primary/90 to-primary/70",
    bgColor: "bg-primary/5",
    stats: "₦500M+ in local trades"
  }, {
    icon: Calendar,
    title: "Community Events",
    description: "Discover, create, and attend local events. Stay connected with what's happening around you.",
    color: "from-primary/80 to-secondary/90",
    bgColor: "bg-primary/5",
    stats: "10K+ events hosted"
  }, {
    icon: MapPin,
    title: "Location Services",
    description: "Find local services, businesses, and resources specific to your neighborhood.",
    color: "from-secondary/90 to-primary/90",
    bgColor: "bg-primary/5",
    stats: "5K+ local businesses"
  }];
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
    location: "Victoria Island, Lagos",
    content: "NeighborLink has transformed how I connect with my community. The safety features give me peace of mind.",
    rating: 5,
    avatar: "SJ",
    verified: true
  }, {
    name: "Ahmed Ibrahim",
    location: "Wuse II, Abuja",
    content: "Found amazing local services and made great friends through this platform. Highly recommended!",
    rating: 5,
    avatar: "AI",
    verified: true
  }, {
    name: "Grace Okafor",
    location: "GRA, Port Harcourt",
    content: "The marketplace feature is fantastic. I've bought and sold items easily within my neighborhood.",
    rating: 5,
    avatar: "GO",
    verified: true
  }];
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
      }} className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          
          <div className="flex items-center space-x-3">
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
                <Button size="default" className="bg-gradient-to-r from-primary to-primary/80">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
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
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm sm:text-base">
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
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.3) 30%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 1) 100%)'
          }}
        />
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-24 bg-muted/30 relative">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          <motion.div className="text-center space-y-4 mb-16" initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
            <Badge className="w-fit mx-auto">
              <Zap className="w-3 h-3 mr-1" />
              Features
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Everything you need for community living</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover powerful features designed to bring neighbors together and build stronger communities.
            </p>
          </motion.div>
          
          {/* Interactive Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div initial={{
              opacity: 0,
              x: -50
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
              <Card className={`p-8 ${features[activeFeature].bgColor} border-0 shadow-xl`}>
                <CardContent className="space-y-6 p-0">
                  <div className="flex items-center space-x-4">
                    <motion.div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${features[activeFeature].color} flex items-center justify-center shadow-lg`} animate={{
                      rotate: 360
                    }} transition={{
                      duration: 40,
                      repeat: Infinity,
                      ease: "linear"
                    }}>
                       {(() => {
                        const IconComponent = features[activeFeature].icon;
                        return <IconComponent className="w-8 h-8 text-white" />;
                      })()}
                     </motion.div>
                    <div>
                      <motion.h3 className="text-2xl font-bold" key={activeFeature} initial={{
                        opacity: 0,
                        y: 20
                      }} animate={{
                        opacity: 1,
                        y: 0
                      }}>
                        {features[activeFeature].title}
                      </motion.h3>
                      <motion.p className="text-sm text-muted-foreground" key={`${activeFeature}-stats`} initial={{
                        opacity: 0
                      }} animate={{
                        opacity: 1
                      }} transition={{
                        delay: 0.2
                      }}>
                        {features[activeFeature].stats}
                      </motion.p>
                    </div>
                  </div>
                  <motion.p className="text-muted-foreground leading-relaxed" key={`${activeFeature}-desc`} initial={{
                    opacity: 0,
                    y: 20
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }} transition={{
                    delay: 0.1
                  }}>
                    {features[activeFeature].description}
                  </motion.p>
                  <motion.div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                    <motion.div className={`h-full bg-gradient-to-r ${features[activeFeature].color} rounded-full`} initial={{
                      width: "0%"
                    }} animate={{
                      width: "100%"
                    }} transition={{
                      duration: 6,
                      ease: "linear"
                    }} key={activeFeature} />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div className="grid grid-cols-2 gap-4" initial={{
              opacity: 0,
              x: 50
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }}>
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return <motion.div key={index} className={`cursor-pointer transition-all duration-300 ${index === activeFeature ? 'scale-105' : 'hover:scale-102'}`} onClick={() => setActiveFeature(index)} whileHover={{
                  y: -5
                }} whileTap={{
                  scale: 0.95
                }}>
                    <Card className={`p-6 text-center space-y-3 ${index === activeFeature ? feature.bgColor + ' border-primary/50' : 'hover:shadow-lg'}`}>
                      <motion.div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto`} animate={{
                      scale: index === activeFeature ? [1, 1.1, 1] : 1
                    }} transition={{
                      duration: 0.5
                    }}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </motion.div>
                      <h4 className="font-semibold text-sm">{feature.title}</h4>
                    </Card>
                  </motion.div>;
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Animated Testimonials */}
      <section id="testimonials" className="py-24 overflow-hidden">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          <motion.div className="text-center space-y-4 mb-16" initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
            <Badge className="w-fit mx-auto">
              <Heart className="w-3 h-3 mr-1" />
              Testimonials
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Loved by communities nationwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users say about building stronger communities with NeighborLink.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => <motion.div key={index} initial={{
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
              scale: 1.02
            }}>
                <Card className="p-6 space-y-4 h-full hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => <motion.div key={i} initial={{
                      opacity: 0,
                      scale: 0
                    }} animate={{
                      opacity: 1,
                      scale: 1
                    }} transition={{
                      delay: 0.5 + i * 0.1
                    }}>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </motion.div>)}
                    </div>
                    {testimonial.verified && <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>}
                  </div>
                  
                  <motion.p className="text-muted-foreground italic" initial={{
                  opacity: 0
                }} whileInView={{
                  opacity: 1
                }} transition={{
                  delay: 0.3
                }}>
                    "{testimonial.content}"
                  </motion.p>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Device Compatibility with Animations */}
      <section className="py-24 bg-muted/30">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24 text-center">
          <motion.div className="space-y-4 mb-12" initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
            <Badge className="w-fit mx-auto">
              <TrendingUp className="w-3 h-3 mr-1" />
              Multi-Platform
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Available everywhere you are</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Access NeighborLink on any device. Seamless experience across web, mobile, and tablet.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
                  <Card className="p-8 text-center space-y-4 hover:shadow-xl transition-shadow">
                    <motion.div animate={{
                    rotateY: [0, 180, 360]
                  }} transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}>
                      <IconComponent className="w-12 h-12 text-primary mx-auto" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">{device.title}</h3>
                    <p className="text-muted-foreground">{device.desc}</p>
                  </Card>
                </motion.div>;
            })}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <motion.section className="py-24 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground relative overflow-hidden rounded-[15px]" style={{
        y: y1
      }}>
        <motion.div className="absolute inset-0 opacity-10" animate={{
          backgroundPosition: ["0% 0%", "100% 100%"]
        }} transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }} style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }} />
        
        <div className="absolute inset-0 opacity-20">
          {Array.from({
            length: 30
          }).map((_, i) => <motion.div key={i} className="absolute text-white" style={{
            left: `${i * 13 % 100}%`,
            top: `${i * 17 % 100}%`,
            fontSize: '24px'
          }} animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.7, 0.3]
          }} transition={{
            duration: 3 + i % 3,
            repeat: Infinity,
            delay: i % 5 * 0.5
          }}>
              {i % 6 === 0 && <Users className="w-6 h-6" />}
              {i % 6 === 1 && <Shield className="w-6 h-6" />}
              {i % 6 === 2 && <MessageSquare className="w-6 h-6" />}
              {i % 6 === 3 && <Heart className="w-6 h-6" />}
              {i % 6 === 4 && <MapPin className="w-6 h-6" />}
              {i % 6 === 5 && <Calendar className="w-6 h-6" />}
            </motion.div>)}
        </div>
        
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24 text-center space-y-8 relative">
          <motion.div initial={{
            opacity: 0,
            scale: 0.8
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold">Ready to connect with your community?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of Nigerians already building stronger, safer neighborhoods with NeighborLink.
            </p>
          </motion.div>
          
          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: 0.2
          }}>
            <motion.div whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div whileHover={{
              scale: 1.05
            }} whileTap={{
              scale: 0.95
            }}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-green-500 hover:bg-white hover:text-primary">
                <Phone className="mr-2 h-4 w-4" />
                Download App
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          <motion.div className="text-center space-y-4 mb-16" initial={{
            opacity: 0,
            y: 50
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
            <Badge className="w-fit mx-auto">
              <Globe className="w-3 h-3 mr-1" />
              Contact Us
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold">Get in touch</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions? We're here to help you build stronger communities.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
                  <Card className="p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                    <motion.div animate={{
                    scale: [1, 1.1, 1]
                  }} transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}>
                      <IconComponent className="w-8 h-8 text-primary mx-auto" />
                    </motion.div>
                    <h3 className="font-semibold">{contact.title}</h3>
                    <p className="text-muted-foreground">{contact.info}</p>
                    <p className="text-sm text-muted-foreground">{contact.detail}</p>
                  </Card>
                </motion.div>;
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24">
          <div className="grid md:grid-cols-4 gap-8">
            <motion.div className="space-y-4" initial={{
              opacity: 0
            }} whileInView={{
              opacity: 1
            }} viewport={{
              once: true
            }}>
              <div className="flex items-center space-x-2">
                <img src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" alt="NeighborLink Logo" className="h-6 w-6" />
                <span className="font-bold">NeighborLink</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Building stronger, safer communities across Nigeria.
              </p>
            </motion.div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link to="/auth" className="block text-muted-foreground hover:text-primary transition-colors">Web App</Link>
                <a href="#" className="block text-muted-foreground hover:text-primary transition-colors">Mobile App</a>
                <Link to="/api-docs" className="block text-muted-foreground hover:text-primary transition-colors">API Documentation</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">About Us</Link>
                <a href="#contact" className="block text-muted-foreground hover:text-primary transition-colors">Contact</a>
                <Link to="/careers" className="block text-muted-foreground hover:text-primary transition-colors">Careers</Link>
                <Link to="/press" className="block text-muted-foreground hover:text-primary transition-colors">Press</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                <Link to="/community-guidelines" className="block text-muted-foreground hover:text-primary transition-colors">Community Guidelines & Security</Link>
              </div>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <motion.div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0" initial={{
            opacity: 0
          }} whileInView={{
            opacity: 1
          }} viewport={{
            once: true
          }}>
            <p className="text-sm text-muted-foreground">© 2025 NeighborLink. All rights reserved.</p>
            <div className="flex space-x-4">
              {[...Array(3)].map((_, i) => <motion.a key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors" whileHover={{
                scale: 1.2,
                rotate: 360
              }} transition={{
                duration: 0.3
              }}>
                  <span className="sr-only">Social Media</span>
                  <div className="w-5 h-5 bg-current rounded" />
                </motion.a>)}
            </div>
          </motion.div>
        </div>
      </footer>
      </div>
    </div>;
};
export default InteractiveLandingPage;