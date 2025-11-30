import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiZap, FiLayout, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { useScrollAnimation } from '@/shared/hooks/useScrollAnimation';
import { Header } from '@/shared/components';
import styles from './LandingPage.module.css';
import phoneImg from '@/assets/stock-phone-img.png';

// Feature Card Component with scroll animation
const FeatureCard: FC<{ icon: typeof FiLayout; title: string; description: string }> = ({ 
  icon: Icon, 
  title, 
  description 
}) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  
  return (
    <div 
      ref={ref}
      className={`${styles.featureCard} ${isVisible ? styles.visible : ''}`}
    >
      <div className={styles.featureIcon}>
        <Icon />
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
};

export const LandingPage: FC = () => {
  return (
    <div className={styles.landing}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Your Personal
            <span className={styles.highlight}> Command Center</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Verge is an AI-assisted productivity platform that reduces cognitive overload.
            Organize tasks, deadlines, and projects with minimal effort and maximum clarity.
          </p>
          <div className={styles.heroCta}>
            <Link to="/login" className={styles.primaryButton}>
              Get Started Free
            </Link>
            <Link to="/login" className={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.floatingCard}>
            <div className={styles.cardContent}>
              <FiCheckCircle className={styles.cardIcon} />
              <span>Track Tasks</span>
            </div>
          </div>
          <div className={`${styles.floatingCard} ${styles.delayed}`}>
            <div className={styles.cardContent}>
              <FiClock className={styles.cardIcon} />
              <span>Urgent Deadlines</span>
            </div>
          </div>
          <div className={`${styles.floatingCard} ${styles.moreDelayed}`}>
            <div className={styles.cardContent}>
              <FiZap className={styles.cardIcon} />
              <span>AI Assist Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Choose Verge?</h2>
          <p className={styles.sectionSubtitle}>
            Built to reduce mental fatigue from fragmented productivity tools
          </p>
        </div>

        <div className={styles.featureGrid}>
          <FeatureCard
            icon={FiLayout}
            title="Centralized Workspace"
            description="All your tasks, deadlines, and meetings in one clean dashboard. No more switching between apps."
          />

          <FeatureCard
            icon={FiZap}
            title="Optional AI Assistance"
            description="AI suggests priorities and subtasks only when you ask. You stay in control, always."
          />

          <FeatureCard
            icon={FiTrendingUp}
            title="Flexible Views"
            description="Switch between List, Calendar, and Kanban views to match your working style."
          />

          <FeatureCard
            icon={FiClock}
            title="Smart Notifications"
            description="Context-aware reminders that help without overwhelming. Only what matters, when it matters."
          />

          <FeatureCard
            icon={FiUsers}
            title="Team Collaboration"
            description="Share workspaces, assign tasks, and track progress together in real-time."
          />

          <FeatureCard
            icon={FiCheckCircle}
            title="Minimal Cognitive Load"
            description="Clean interface that shows only what you need. Reduce mental fatigue, increase focus."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaImage}>
            <img 
              src={phoneImg} 
              alt="Verge Mobile App" 
              className={styles.phoneImage}
            />
          </div>
          
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to take control?</h2>
            <p className={styles.ctaSubtitle}>
              Join students and teams to reduce your workflow fragmentation
            </p>
            <Link to="/login" className={styles.ctaButton}>
              Start Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerText}>
          &copy; 2025 Verge. Built for clarity, designed for focus.
        </p>
      </footer>
    </div>
  );
};
