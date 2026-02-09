import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-wakeboard.jpg";
import { Waves } from "lucide-react";

const HeroScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Wakeboard rider at sunset"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 gradient-dark-overlay" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-12 left-0 right-0 flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-2">
          <Waves className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight text-foreground">
            WAKE<span className="text-gradient">PRO</span>
          </span>
        </div>
        <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
          Escola de Wakeboard
        </p>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative z-10 w-full px-6 pb-12 flex flex-col items-center gap-6"
      >
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
            Domine as <br />
            <span className="text-gradient">águas.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">
            Sessions exclusivas com instrutores profissionais. 
            Agende sua experiência agora.
          </p>
        </div>

        <button
          onClick={() => navigate("/agendar")}
          className="w-full max-w-sm py-4 px-8 rounded-2xl gradient-primary text-primary-foreground font-semibold text-lg shadow-glow active:scale-[0.98] transition-transform"
        >
          Quero agendar minha session
        </button>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="text-center">
            <span className="block text-xl font-bold text-foreground">500+</span>
            Sessions
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <span className="block text-xl font-bold text-foreground">4.9</span>
            Avaliação
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <span className="block text-xl font-bold text-foreground">10+</span>
            Anos
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroScreen;
