import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Facebook, Instagram, Twitter, MapPin, Share2, Loader2, Sparkles, Phone } from 'lucide-react';
import { addRegistration, addGalleryItem, subscribeToGallery } from './lib/firebase';
import { cn } from './lib/utils';
import { formatDistanceToNow } from 'date-fns';

const EVENT_DATE = new Date('2026-06-13T08:00:00+02:00'); // Assuming South African Standard Time (SAST) since it's in Cape Town

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = EVENT_DATE.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
      const s = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');

      setTimeLeft({ d, h, m, s });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <div className="countdown-timer text-xl md:text-2xl whitespace-nowrap">{timeLeft.d}D : {timeLeft.h}H : {timeLeft.m}M : {timeLeft.s}S</div>;
}

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Phone is required'),
  category: z.string().min(2, 'Category is required'),
});

function RegistrationForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(registrationSchema)
  });
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      await addRegistration(data);
      
      // Send confirmation SMS
      await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.phone,
          message: `Hi ${data.fullName}, your registration for the David Isaacs Classic 2026 (${data.category}) is confirmed! We will contact you soon. - WPNBBF Team.`
        })
      });

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Registration failed', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Full Name</label>
        <input {...register('fullName')} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-accent transition-colors" placeholder="John Doe" />
        {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message as string}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Email</label>
        <input {...register('email')} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-accent transition-colors" placeholder="john@example.com" />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message as string}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Phone</label>
        <input {...register('phone')} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-accent transition-colors" placeholder="+27..." />
        {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message as string}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Category</label>
        <select {...register('category')} className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-accent transition-colors [&>option]:bg-zinc-900">
          <option value="">Select Category</option>
          <option value="Men's Bodybuilding">Men's Bodybuilding</option>
          <option value="Men's Physique">Men's Physique</option>
          <option value="Bikini">Bikini</option>
          <option value="Figure">Figure</option>
          <option value="Classic Physique">Classic Physique</option>
        </select>
        {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message as string}</p>}
      </div>
      <button disabled={isSubmitting} type="submit" className="w-full accent-btn py-3 mt-2 rounded-md flex items-center justify-center gap-2">
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'SUBMIT ENTRY'}
      </button>
      {success && <p className="text-green-400 text-center text-xs">Registration successful! We will contact you soon.</p>}
      <p className="text-[9px] opacity-40 text-center uppercase mt-2">By registering, you agree to the WPNBBF Rules & Privacy Policy</p>
    </form>
  );
}

function GalleryItem({ item, index }: { key?: string | number, item: any; index: number }) {
  const { scrollYProgress } = useScroll();
  // Using index to vary the parallax a bit
  const y = useTransform(scrollYProgress, [0, 1], [0, -100 + (index % 3) * 30]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 1.05]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out ${item.title} from WPNBBF!`,
        url: item.imageUrl,
      }).catch(console.error);
    } else {
      alert("Sharing not supported on this browser.");
    }
  };

  return (
    <motion.div style={{ y, scale }} className="relative overflow-hidden rounded group bg-white/5 border border-white/5 flex items-center justify-center">
      <img 
        src={item.imageUrl} 
        alt={item.title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 aspect-[3/4]" 
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement?.classList.add('aspect-[3/4]');
          const textNode = document.createElement('span');
          textNode.className = 'text-[10px] text-white/40 uppercase absolute';
          textNode.innerText = 'Upload image to public/gallery';
          (e.target as HTMLImageElement).parentElement?.appendChild(textNode);
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 flex flex-col justify-end">
        <h4 className="font-bold text-[10px] uppercase truncate">{item.title}</h4>
      </div>
      <button onClick={handleShare} className="absolute top-2 right-2 p-1 bg-black/60 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:bg-black/90">
        <Share2 size={12} /> Share
      </button>
    </motion.div>
  );
}

function Gallery() {
  const [items, setItems] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    return subscribeToGallery(setItems);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (data.imageUrl) {
        await addGalleryItem({
          title: prompt.slice(0, 30) + '...',
          year: new Date().getFullYear().toString(),
          imageUrl: data.imageUrl
        });
        setPrompt('');
      } else {
         alert("Failed to generate: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const staticItems = [
    {
      id: 'static-1',
      title: 'Legendary Posing',
      year: '1960s',
      imageUrl: '/gallery/david-posing.jpg'
    },
    {
      id: 'static-2',
      title: 'Classic Physique',
      year: '1960s',
      imageUrl: '/gallery/david-younger.jpg'
    },
    {
      id: 'static-3',
      title: 'With Arnold Schwarzenegger',
      year: '1966',
      imageUrl: '/gallery/david-arnold.jpg'
    },
    {
      id: 'static-4',
      title: 'David Isaacs Today',
      year: 'Recent',
      imageUrl: '/gallery/david-recent.jpg'
    }
  ];

  const allItems = [...staticItems, ...items];

  const filteredItems = allItems.filter(item => 
    item.title?.toLowerCase().includes(filter.toLowerCase()) || 
    item.year?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <input 
          type="text" 
          placeholder="Filter by title or year..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-md focus:outline-none focus:border-accent text-sm"
        />
        <form onSubmit={handleGenerate} className="flex gap-2">
           <input 
            type="text" 
            placeholder="Enter AI prompt..." 
            value={prompt}
            disabled={isGenerating}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 min-w-0 bg-white/5 border border-white/10 px-3 py-2 rounded-md focus:outline-none focus:border-accent text-sm"
          />
          <button disabled={isGenerating} type="submit" className="accent-btn px-4 py-2 rounded-md text-[10px] flex items-center shrink-0">
            {isGenerating ? <Loader2 className="animate-spin" size={14} /> : 'Generate Visual'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {filteredItems.map((item, i) => (
          <GalleryItem key={item.id} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#ffffff] font-body flex flex-col">
      {/* Navbar */}
      <nav className="h-16 flex items-center justify-between px-4 md:px-8 bg-black/50 border-b border-white/10 shrink-0 sticky top-0 z-50 glass">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black italic cursor-pointer" onClick={() => window.scrollTo(0, 0)}>WPNBBF</span>
          <div className="hidden lg:flex gap-6 text-sm font-medium opacity-70 uppercase tracking-widest">
            <button onClick={() => scrollTo('about')} className="hover:opacity-100 transition-opacity">ABOUT</button>
            <button onClick={() => scrollTo('history')} className="hover:opacity-100 transition-opacity">HISTORY</button>
            <button onClick={() => scrollTo('athletes')} className="hover:opacity-100 transition-opacity">ATHLETES</button>
            <button onClick={() => scrollTo('gallery')} className="hover:opacity-100 transition-opacity">GALLERY</button>
            <button onClick={() => scrollTo('location')} className="hover:opacity-100 transition-opacity">LOCATION</button>
            <button onClick={() => scrollTo('rules')} className="hover:opacity-100 transition-opacity">RULES</button>
            <button onClick={() => scrollTo('sponsors')} className="hover:opacity-100 transition-opacity">SPONSORS</button>
          </div>
        </div>
        <button onClick={() => scrollTo('athletes')} className="accent-btn px-6 py-2 rounded-full text-sm">
          REGISTER NOW
        </button>
      </nav>

      <main className="bento-container w-full max-w-[1400px] mx-auto py-8 text-3d">
        {/* 1. Hero */}
        <div id="hero" className="bento-item col-span-12 lg:col-span-8 lg:row-span-2 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent min-h-[450px]">
          <div className="absolute inset-0 z-[-1] bg-center bg-cover bg-[center_top_10%] opacity-40 mix-blend-overlay" style={{backgroundImage: "url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80')"}}></div>
          <h1 className="bold-header text-6xl md:text-8xl mb-4 text-3d">THE DAVID ISAACS<br/>CLASSIC 2026</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-6 mt-2 text-3d">
            <div className="bg-white/10 px-4 py-2 rounded-lg inline-block border border-white/10 backdrop-blur-md">
              <span className="text-xs opacity-50 block uppercase font-bold tracking-wider mb-1">Event Countdown</span>
              <Countdown />
            </div>
            <div className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-lg border border-white/5 backdrop-blur-sm">
              <span className="bg-red-600 w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
              <span className="text-sm font-bold uppercase tracking-widest">Registration Open</span>
            </div>
          </div>
        </div>
        
        {/* 2. Registration Form */}
        <div id="athletes" className="bento-item col-span-12 lg:col-span-4 lg:row-span-2 flex flex-col hover:z-20 transition-all duration-500">
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wider border-b border-white/10 pb-2 text-3d">Athlete Registration</h2>
          <div className="text-3d w-full">
            <RegistrationForm />
          </div>
        </div>

        {/* 3. About WPNBBF */}
        <div id="about" className="bento-item col-span-12 lg:col-span-8 hover:z-20 transition-all duration-500">
          <h2 className="text-xs font-bold mb-4 uppercase tracking-widest border-b border-white/10 pb-2 text-3d text-accent">About WPNBBF</h2>
          <div className="grid md:grid-cols-2 gap-8 text-sm opacity-80 leading-relaxed font-medium text-3d">
            <div>
              <p className="mb-4">The Western Province Natural Bodybuilding Federation (WPNBBF) was established in 1951, dedicated to promoting drug-free bodybuilding and fitness in the region. Our mission is to protect the integrity of the sport.</p>
              <p>We uphold the highest standards of natural competition, providing athletes a fair stage to showcase their hard work, dedication, and pure genetic potential.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/5 flex flex-col justify-center items-center text-center shadow-[inset_0_0_20px_rgba(255,215,0,0.05)] border-t-accent/30">
              <span className="text-4xl mb-2 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">🏆</span>
              <p className="font-bold uppercase tracking-wider mb-2 text-accent">100% Natural Guarantee</p>
              <p className="text-xs opacity-70">Dedicated to polygraph-tested and urine-tested shows strictly conforming with international natural bodybuilding standards.</p>
              <button onClick={() => scrollTo('rules')} className="mt-4 px-4 py-1.5 border border-white/20 rounded hover:bg-white/10 hover:border-accent transition-colors text-[10px] uppercase font-bold tracking-widest">Read Full Rules</button>
            </div>
          </div>
        </div>

        {/* 3.5 History of David Isaacs */}
        <div id="history" className="bento-item col-span-12 lg:col-span-8 flex flex-col relative overflow-hidden group hover:z-20 transition-all duration-500">
          <div className="absolute inset-0 z-[-1] bg-center bg-cover opacity-10 mix-blend-overlay group-hover:opacity-30 transition-opacity duration-700" style={{backgroundImage: "url('/gallery/david-2.jpg')"}}></div>
          <h2 className="text-xl font-black mb-4 uppercase tracking-widest text-accent border-b border-accent/20 pb-2 text-3d text-shadow-sm">The Legend: David Isaacs</h2>
          <div className="flex flex-col md:flex-row gap-6 relative z-10 w-full font-sans text-3d">
            <div className="flex-1 space-y-4 text-sm opacity-90 leading-relaxed font-medium">
              <p>
                <span className="font-bold text-white drop-shadow-md">Humble Beginnings:</span> David was born in Uniondale and moved to Cape Town when his mom got a job as a domestic worker. 
                At the age of 18, he weighed only 50kg. Through sheer willpower and dedication over ten years, he bulked up to an astounding 112kg when he eventually competed in the Mr. Universe competition in London.
              </p>
              <p>
                <span className="font-bold text-white drop-shadow-md">Grueling Regimen:</span> He built his incredible physique the hard way. Relying on heavy, rudimentary homemade iron, he trained relentlessly in backyards and the open air. He later moved his intense workouts into a "hokkie" (makeshift structure), focusing fiercely on pure foundational strength years before modern commercial gyms were accessible.
              </p>
              <p>
                <span className="font-bold text-white drop-shadow-md">Global Stage & Rivalries:</span> Isaacs participated in the legendary 1966 Mr. Universe in London alongside 130 contestants from 30 nations. It was here in the highly-contested "tall men" division that David stood shoulder-to-shoulder competing against a young, 19-year-old Austrian phenom named Arnold Schwarzenegger.
              </p>
            </div>
            
            <div className="flex-1 space-y-4 text-sm opacity-90 leading-relaxed font-medium flex flex-col">
               <img 
                 src="/gallery/david-recent.jpg" 
                 alt="David Isaacs flexing" 
                 referrerPolicy="no-referrer"
                 className="w-full h-40 object-cover rounded-md border border-white/10 shadow-lg mb-2 object-top"
                 onError={(e) => {
                   // Fallback for preview if image hasn't been uploaded yet
                   (e.target as HTMLImageElement).style.display = 'none';
                 }}
               />
               <p>
                 Sharing the stage with future bodybuilding and political royalty created a historic, cross-cultural lineup remembered as a defining moment in Golden Era natural bodybuilding.
               </p>
               <div className="bg-black/50 p-4 rounded border-l-2 border-accent mt-auto mb-3">
                  <p className="italic">"He later participated in the 1969 Mr. Universe, Mr. World, and Mr. International contests. Today, the legend continues to inspire and he lives locally in Heideveld."</p>
               </div>
               
               <a 
                 href="https://www.google.com/search?q=David+Isaacs+Cape+Town+Bodybuilder+Mr+Universe" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-accent/20 to-transparent hover:from-accent/40 border border-accent/50 rounded-md transition-all text-[10px] uppercase font-bold tracking-widest text-accent shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)] transform hover:scale-105"
               >
                 Search More About His Legacy
               </a>
            </div>
          </div>
        </div>

        {/* 4. Core Organizers - POP OUT */}
        <div className="bento-item col-span-12 md:col-span-6 lg:col-span-4 flex flex-col justify-between relative overflow-hidden group border-accent/30 shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:border-accent hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/20 rounded-lg text-accent">
                <Phone size={20} />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-accent">Contact Organizers</h2>
            </div>
            
            <div className="space-y-4 flex-1">
              <a href="tel:+27813564430" className="flex flex-col p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-accent/50 transition-all group/contact cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-black text-white group-hover/contact:text-accent transition-colors">Haroun</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-black bg-accent px-2 py-0.5 rounded">President</div>
                </div>
                <div className="text-xs font-mono tracking-widest text-white/70 group-hover/contact:text-white transition-colors">+27 81 356 4430</div>
              </a>
              
              <a href="tel:+27721601131" className="flex flex-col p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-accent/50 transition-all group/contact cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-black text-white group-hover/contact:text-accent transition-colors">Andrew</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/10 border border-white/10 px-2 py-0.5 rounded">Finance</div>
                </div>
                <div className="text-xs font-mono tracking-widest text-white/70 group-hover/contact:text-white transition-colors">+27 72 160 1131</div>
              </a>
              
              <a href="tel:+27795927850" className="flex flex-col p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/5 hover:border-accent/50 transition-all group/contact cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-black text-white group-hover/contact:text-accent transition-colors">Jackie</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/10 border border-white/10 px-2 py-0.5 rounded">Secretary</div>
                </div>
                <div className="text-xs font-mono tracking-widest text-white/70 group-hover/contact:text-white transition-colors">+27 79 592 7850</div>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/50">Tap cards to call</span>
              <div className="flex items-center gap-1.5 opacity-80">
                <MapPin size={12} className="text-accent"/>
                <span className="text-[10px] tracking-wider uppercase">Cape Town, ZA</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. View Categories */}
        <div className="bento-item col-span-12 md:col-span-6 lg:col-span-4 lg:row-start-5 lg:col-start-9 flex flex-col justify-start hover:z-20 transition-all duration-500">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-3d text-accent">Available Categories</h2>
          <div className="flex flex-wrap gap-2 text-3d">
            <span className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 hover:border-accent hover:text-accent transition-colors shadow-inner">Men's Bodybuilding</span>
            <span className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 hover:border-accent hover:text-accent transition-colors shadow-inner">Men's Physique</span>
            <span className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 hover:border-accent hover:text-accent transition-colors shadow-inner">Bikini Model</span>
            <span className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 hover:border-accent hover:text-accent transition-colors shadow-inner">Women's Figure</span>
            <span className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 hover:border-accent hover:text-accent transition-colors shadow-inner">Classic Physique</span>
            <span className="px-3 py-1.5 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5 hover:border-accent hover:text-accent transition-colors shadow-inner">Masters Open</span>
          </div>
        </div>

        {/* 6. Gallery */}
        <div id="gallery" className="bento-item col-span-12 lg:col-span-8 lg:row-span-2 lg:row-start-4 lg:col-start-1 flex flex-col hover:z-20 transition-all duration-500">
          <h2 className="text-xs font-bold mb-4 uppercase tracking-widest border-b border-accent/20 pb-2 text-3d text-accent">Gallery & AI Generator</h2>
          <div className="text-3d flex-1">
            <Gallery />
          </div>
        </div>

        {/* 7. Sponsors */}
        <div id="sponsors" className="bento-item col-span-12 flex flex-col md:flex-row items-center gap-6 py-6 overflow-hidden relative border-y-accent/20">
          <div className="z-10 flex items-center justify-center shrink-0 md:bg-transparent bg-black/80 md:pr-4 md:border-r border-accent/20 p-2 md:p-0 rounded backdrop-blur-md shadow-[0_0_20px_rgba(255,215,0,0.1)] text-3d">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-center text-accent">Official Sponsors</span>
          </div>
          
          <div className="flex-1 w-full overflow-hidden relative flex items-center h-12 mask-fade-edges text-3d">
            <motion.div 
              className="flex items-center gap-16 absolute whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 25, repeat: Infinity }}
            >
              {[
                { name: "Amy's Private Range", url: "#", style: "font-bold text-lg tracking-tighter uppercase" },
                { name: "Zahir's Biltong", url: "#", style: "font-bold text-lg tracking-tighter italic text-accent uppercase" },
                { name: "GoBrown.co.za", url: "http://www.gobrown.co.za", style: "font-bold text-lg underline decoration-accent uppercase text-white drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" },
                { name: "WPNBBF Athletics", url: "#", style: "font-bold text-lg tracking-widest text-[#FFD700] uppercase pt-1" },
                { name: "Cape Gym Equipment", url: "#", style: "font-black text-lg tracking-tight uppercase border border-white/20 px-2 py-1 rounded" },
                /* Duplicate for seamless infinite scroll loop */
                { name: "Amy's Private Range", url: "#", style: "font-bold text-lg tracking-tighter uppercase" },
                { name: "Zahir's Biltong", url: "#", style: "font-bold text-lg tracking-tighter italic text-accent uppercase" },
                { name: "GoBrown.co.za", url: "http://www.gobrown.co.za", style: "font-bold text-lg underline decoration-accent uppercase text-white drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]" },
                { name: "WPNBBF Athletics", url: "#", style: "font-bold text-lg tracking-widest text-[#FFD700] uppercase pt-1" },
                { name: "Cape Gym Equipment", url: "#", style: "font-black text-lg tracking-tight uppercase border border-white/20 px-2 py-1 rounded" },
              ].map((s, i) => (
                <a key={i} href={s.url} target={s.url !== "#" ? "_blank" : undefined} rel="noopener noreferrer" className={`${s.style} opacity-70 hover:opacity-100 transition-all hover:scale-110 inline-block`}>
                  {s.name}
                </a>
              ))}
            </motion.div>
          </div>
        </div>

        {/* 8. Event Location & Venue Map */}
        <div id="location" className="bento-item col-span-12 flex flex-col md:flex-row gap-6 p-6 hover:z-20 transition-all duration-500">
           <div className="w-full md:w-1/3 flex flex-col justify-between text-3d z-10">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wider mb-2 border-b border-accent/20 pb-4 text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">Venue Location</h2>
                <div className="space-y-4 font-medium text-sm opacity-80 mt-4 leading-relaxed">
                   <p>Join us at the heart of the Western Province for the highly anticipated David Isaacs Classic 2026.</p>
                   <p className="flex items-start gap-3 text-white bg-black/40 p-3 rounded-lg border border-white/5">
                      <MapPin size={24} className="shrink-0 mt-0.5 text-accent animate-bounce" />
                      <span className="font-mono text-xs">Cape Town Central<br/>Western Province<br/>South Africa</span>
                   </p>
                </div>
              </div>
              <a href="https://maps.app.goo.gl/t6C16uEn3SdivDcX8" target="_blank" rel="noopener noreferrer" className="accent-btn text-xs px-6 py-3 rounded text-center mt-6 uppercase font-black w-fit">
                Get Directions
              </a>
           </div>
           <div className="w-full md:w-2/3 h-64 md:h-[350px] rounded hover:opacity-100 transition-opacity overflow-hidden border-2 border-accent/20 hover:border-accent shadow-[0_0_20px_rgba(255,215,0,0.1)] grayscale-0 relative glass text-3d">
               <iframe 
                      title="Google Maps Location Cape Town"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d105886.99285093748!2d18.36159670732386!3d-33.91458999908611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc500f8826eed7%3A0x687fe1fc2828aa87!2sCape%20Town!5e0!3m2!1sen!2sza!4v1714138128365!5m2!1sen!2sza" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0, minHeight: '100%' }} 
                      allowFullScreen={true} 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0">
               </iframe>
           </div>
        </div>

        {/* 9. Dedicated Rules & Regulations */}
        <div id="rules" className="bento-item col-span-12 flex flex-col bg-black/60 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border-t-accent hover:z-20 transition-all duration-500">
           <h2 className="text-xl font-bold mb-6 uppercase tracking-wider border-b border-accent/20 pb-4 text-accent text-3d drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">WPNBBF Official Rules & Regulations</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-3d">
             <div className="space-y-4">
               <h3 className="font-bold text-sm uppercase tracking-widest opacity-90 border-l-2 border-accent pl-3">Eligibility & Integrity</h3>
               <ul className="list-disc list-inside text-xs opacity-70 space-y-3 leading-relaxed">
                 <li>All athletes strictly must be drug-free for a minimum of 7 years prior to competing.</li>
                 <li>Any use of banned substances listed under the WADA prohibited list is strictly forbidden.</li>
                 <li>Prescription medications must be cleared by via a TUE (Therapeutic Use Exemption) form.</li>
                 <li>Polygraph (lie-detector) testing may be required for category winners at random.</li>
               </ul>
             </div>
             
             <div className="space-y-4">
               <h3 className="font-bold text-sm uppercase tracking-widest opacity-90 border-l-2 border-accent pl-3">Stage & Presentation</h3>
               <ul className="list-disc list-inside text-xs opacity-70 space-y-3 leading-relaxed">
                 <li>Individual posing routines for Bodybuilding and Classic specific categories must not exceed 60 seconds.</li>
                 <li>Music must be provided in MP3 format with no profanity.</li>
                 <li>Posing trunks must adhere to standard federation coverage rules (no thongs).</li>
                 <li>Prop usage is only allowed in specific designated routine rounds.</li>
               </ul>
             </div>

             <div className="space-y-4">
               <h3 className="font-bold text-sm uppercase tracking-widest opacity-90 border-l-2 border-accent pl-3">Backstage Protocol</h3>
               <ul className="list-disc list-inside text-xs opacity-70 space-y-3 leading-relaxed">
                 <li>Only one (1) registered coach/handler is permitted backstage per athlete.</li>
                 <li>Tanning must be done using approved products that do not stain venue property.</li>
                 <li>Sportsmanship on and off stage is mandatory. Unprofessional behavior leads to disqualification.</li>
                 <li>Athletes must be present at the mandatory briefing before show start.</li>
               </ul>
             </div>

             <div className="space-y-4">
               <h3 className="font-bold text-sm uppercase tracking-widest opacity-90 border-l-2 border-accent pl-3">Registration & Privacy</h3>
               <ul className="list-disc list-inside text-xs opacity-70 space-y-3 leading-relaxed">
                 <li>No late registrations will be accepted past the official cut-off time.</li>
                 <li>Registration fees are strictly non-refundable.</li>
                 <li>Athletes must carry valid ID on registration day for birth-year verification.</li>
                 <li><strong>Privacy Policy:</strong> Athlete data collected is solely for event administration. We do not sell personal data to third parties.</li>
               </ul>
             </div>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 h-auto py-4 md:h-16 flex flex-col md:flex-row items-center justify-between px-8 bg-black/50 border-t border-white/10 text-[10px] font-medium opacity-70 uppercase tracking-widest gap-4 shrink-0 glass">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="font-bold">&copy; {new Date().getFullYear()} WPNBBF</span>
          <a href="#about" className="hover:text-accent transition-colors">FAQ</a>
          <a href="#about" className="hover:text-accent transition-colors">Contact Us</a>
          <a href="#location" onClick={(e) => { e.preventDefault(); scrollTo('location'); }} className="hover:text-accent transition-colors">Location</a>
          <a href="#rules" onClick={(e) => { e.preventDefault(); scrollTo('rules'); }} className="hover:text-accent transition-colors">Privacy Policy</a>
          <a href="#rules" onClick={(e) => { e.preventDefault(); scrollTo('rules'); }} className="hover:text-accent transition-colors">Rules</a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 items-center">
          <a href="https://instagram.com/wpnbbf" className="flex items-center gap-2 hover:text-accent transition-colors">
            <Instagram size={14} /> <span className="hidden sm:inline">Instagram</span>
          </a>
          <a href="https://facebook.com/wpnbbf" className="flex items-center gap-2 hover:text-accent transition-colors">
            <Facebook size={14} /> <span className="hidden sm:inline">Facebook</span>
          </a>
          <a href="https://twitter.com/wpnbbf" className="flex items-center gap-2 hover:text-accent transition-colors">
            <Twitter size={14} /> <span className="hidden sm:inline">Twitter</span>
          </a>
          <span className="text-black font-bold bg-white/90 px-2 py-1 rounded hidden lg:block">Western Province, ZA</span>
        </div>
      </footer>
    </div>
  );
}

